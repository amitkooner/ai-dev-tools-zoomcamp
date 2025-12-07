import { useState } from 'react'

// Safe code executor using sandboxed iframe
function CodeExecutor({ code, language, onResult }) {
  const [running, setRunning] = useState(false)

  const executeCode = async () => {
    setRunning(true)
    
    try {
      if (language === 'javascript') {
        executeJavaScript(code)
      } else if (language === 'python') {
        await executePython(code)
      } else {
        onResult(`Code execution for ${language} is not supported in the browser.\n\nSupported languages: JavaScript, Python`, true)
      }
    } catch (error) {
      onResult(`Execution error: ${error.message}`, true)
    } finally {
      setRunning(false)
    }
  }

  const executeJavaScript = (code) => {
    // Create a sandboxed iframe for safe execution
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.sandbox = 'allow-scripts'
    document.body.appendChild(iframe)

    const logs = []
    
    // Create the code to run in the iframe
    const wrappedCode = `
      (function() {
        const logs = [];
        const originalConsole = console;
        
        // Override console methods to capture output
        console = {
          log: (...args) => logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' ')),
          error: (...args) => logs.push('Error: ' + args.join(' ')),
          warn: (...args) => logs.push('Warning: ' + args.join(' ')),
          info: (...args) => logs.push(args.join(' '))
        };
        
        try {
          // Execute user code
          const result = eval(${JSON.stringify(code)});
          
          // If there's a return value and no console output, show the result
          if (result !== undefined && logs.length === 0) {
            logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
          }
          
          return { success: true, output: logs.join('\\n') || 'Code executed successfully (no output)' };
        } catch (error) {
          return { success: false, output: error.toString() };
        }
      })()
    `

    // Listen for messages from iframe
    const handleMessage = (event) => {
      if (event.source === iframe.contentWindow) {
        const result = event.data
        onResult(result.output, !result.success)
        window.removeEventListener('message', handleMessage)
        document.body.removeChild(iframe)
      }
    }
    window.addEventListener('message', handleMessage)

    // Write and execute the code in iframe
    iframe.contentWindow.document.open()
    iframe.contentWindow.document.write(`
      <script>
        try {
          const result = ${wrappedCode};
          parent.postMessage(result, '*');
        } catch (e) {
          parent.postMessage({ success: false, output: e.toString() }, '*');
        }
      </script>
    `)
    iframe.contentWindow.document.close()

    // Timeout after 5 seconds
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        window.removeEventListener('message', handleMessage)
        document.body.removeChild(iframe)
        onResult('Execution timed out (5 second limit)', true)
      }
    }, 5000)
  }

  const executePython = async (code) => {
    // Check if Pyodide is already loaded
    if (!window.pyodide) {
      onResult('Loading Python runtime (Pyodide)...', false)
      
      try {
        // Load Pyodide
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
        document.head.appendChild(script)
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
        
        window.pyodide = await window.loadPyodide()
      } catch (error) {
        onResult('Failed to load Python runtime. Please try again.', true)
        return
      }
    }

    try {
      // Capture stdout
      window.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)

      // Run user code
      await window.pyodide.runPythonAsync(code)
      
      // Get output
      const stdout = window.pyodide.runPython('sys.stdout.getvalue()')
      const stderr = window.pyodide.runPython('sys.stderr.getvalue()')
      
      if (stderr) {
        onResult(stderr, true)
      } else {
        onResult(stdout || 'Code executed successfully (no output)', false)
      }
    } catch (error) {
      onResult(error.message, true)
    }
  }

  return (
    <button 
      className="run-btn" 
      onClick={executeCode}
      disabled={running}
    >
      {running ? '⏳ Running...' : '▶ Run Code'}
    </button>
  )
}

export default CodeExecutor
