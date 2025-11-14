// src/components/ProfilePageWithSidebarAndProjectList.tsx
import React, { useState, useEffect } from 'react';
import Client from '../../Configs/CNAPI/CNAPI'; // Điều chỉnh đường dẫn nếu cần
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Kiểu dữ liệu
interface User {
  id: string;
  username: string;
  fullname: string;
  role: string;
}

interface Todo {
  id: string;
  content: string;
  completed: boolean;
}

// --- Todo Item có thể kéo ---
const SortableTodoItem = ({ todo, toggleTodo }: { todo: Todo; toggleTodo: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 transition-all ${
        isDragging ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''
      }`}
      {...attributes}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-700"
      />
      <span className={`flex-1 text-base ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
        {todo.content}
      </span>
      <button {...listeners} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
    </div>
  );
};

// --- Component chính ---
const ProfilePageWithSidebarAndProjectList = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Todo list mẫu — bạn có thể thay bằng API sau
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', content: 'Hoàn thành đăng nhập hệ thống', completed: true },
    { id: '2', content: 'Tạo endpoint /api/users/me', completed: true },
    { id: '3', content: 'Fix lỗi out-of-range MySQL', completed: false },
    { id: '4', content: 'Thêm chức năng tạo sự kiện', completed: false },
    { id: '5', content: 'Kiểm thử với nhiều role', completed: false },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Lấy thông tin người dùng khi mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Client.get<{
          id: string;
          username: string;
          fullname: string;
          role: string;
        }>('/api/users/me');
        setUser(response.data);
      } catch (err: any) {
        console.error('Lỗi tải profile:', err);
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError('Không thể tải thông tin người dùng.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  // --- Hiển thị loading ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Đang tải profile...</p>
        </div>
      </div>
    );
  }

  // --- Hiển thị lỗi ---
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // --- Hiển thị profile ---
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 pt-12">
      {/* Sidebar Profile */}
      <div className="w-80 flex-shrink-0 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 pb-6">
            <div className="text-center my-5">
              {/* Avatar: chữ cái đầu của fullname */}
              <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                {user?.fullname
                  ? user.fullname
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>
              <div className="py-3">
                <h1 className="font-bold text-2xl text-gray-800 dark:text-white">{user?.fullname}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">@{user?.username}</p>
                <div className="inline-flex items-center mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  <span>{user?.role === 'Admin' ? 'Quản trị viên' : 'Sinh viên'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-2">
              <button className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold px-4 py-2 transition">
                Theo dõi
              </button>
              <button className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 transition">
                Nhắn tin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Todo List */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Công việc cần làm</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Kéo và thả để sắp xếp ưu tiên</p>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {todos.map((todo) => (
                  <SortableTodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Gợi ý thêm (tương lai): nút "Thêm công việc" */}
          {/* <button className="mt-4 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm công việc mới
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePageWithSidebarAndProjectList;