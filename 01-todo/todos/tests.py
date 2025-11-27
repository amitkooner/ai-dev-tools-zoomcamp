from django.test import TestCase, Client
from django.urls import reverse
from .models import Todo


class TodoModelTest(TestCase):
    def test_create_todo(self):
        todo = Todo.objects.create(title="Test TODO", description="Test description")
        self.assertEqual(todo.title, "Test TODO")
        self.assertFalse(todo.is_completed)


class TodoViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.todo = Todo.objects.create(title="Test TODO", description="A test item")

    def test_todo_list_view(self):
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test TODO")

    def test_todo_create_view(self):
        response = self.client.post(reverse('todo_create'), {
            'title': 'New TODO',
            'description': 'New description',
        })
        self.assertEqual(response.status_code, 302)  # Redirect after create
        self.assertTrue(Todo.objects.filter(title='New TODO').exists())

    def test_todo_edit_view(self):
        response = self.client.post(reverse('todo_edit', args=[self.todo.pk]), {
            'title': 'Updated TODO',
            'description': 'Updated description',
        })
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Updated TODO')

    def test_todo_delete_view(self):
        response = self.client.get(reverse('todo_delete', args=[self.todo.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Todo.objects.filter(pk=self.todo.pk).exists())

    def test_todo_toggle_view(self):
        self.assertFalse(self.todo.is_completed)
        response = self.client.get(reverse('todo_toggle', args=[self.todo.pk]))
        self.assertEqual(response.status_code, 302)
        self.todo.refresh_from_db()
        self.assertTrue(self.todo.is_completed)