from django.shortcuts import render, redirect, get_object_or_404
from .models import Todo


def todo_list(request):
    todos = Todo.objects.all().order_by('-created_at')
    return render(request, 'todos/todo_list.html', {'todos': todos})


def todo_create(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description', '')
        due_date = request.POST.get('due_date') or None
        Todo.objects.create(title=title, description=description, due_date=due_date)
        return redirect('todo_list')
    return render(request, 'todos/todo_form.html')


def todo_edit(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    if request.method == 'POST':
        todo.title = request.POST.get('title')
        todo.description = request.POST.get('description', '')
        todo.due_date = request.POST.get('due_date') or None
        todo.save()
        return redirect('todo_list')
    return render(request, 'todos/todo_form.html', {'todo': todo})


def todo_delete(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.delete()
    return redirect('todo_list')


def todo_toggle(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.is_completed = not todo.is_completed
    todo.save()
    return redirect('todo_list')