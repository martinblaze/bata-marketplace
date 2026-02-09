'use client';

import { Bell, Check, CheckCheck, Trash2, X, Package, MessageSquare, AlertTriangle, Star, DollarSign } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleOpen,
    setOpen,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'dispute':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'review':
        return <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    const baseClasses = read ? 'bg-white dark:bg-gray-800' : '';
    const borderClasses = read ? 'border-gray-200 dark:border-gray-700' : '';
    
    switch (type) {
      case 'order':
        return `${baseClasses} ${!read ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : borderClasses}`;
      case 'message':
        return `${baseClasses} ${!read ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : borderClasses}`;
      case 'dispute':
        return `${baseClasses} ${!read ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : borderClasses}`;
      case 'review':
        return `${baseClasses} ${!read ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : borderClasses}`;
      case 'payment':
        return `${baseClasses} ${!read ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : borderClasses}`;
      default:
        return `${baseClasses} ${!read ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : borderClasses}`;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  No notifications yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs text-center mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const commonClassName = `p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(
                    notification.type,
                    notification.read
                  )} group`;

                  const content = (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${
                            notification.read
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Remove"
                            >
                              <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return notification.link ? (
                    <Link
                      key={notification.id}
                      href={notification.link}
                      onClick={() => handleNotificationClick(notification)}
                      className={commonClassName}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={commonClassName}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}