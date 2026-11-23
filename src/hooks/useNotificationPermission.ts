import { useState, useEffect, useCallback } from 'react'

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      return perm
    }
    return 'denied'
  }, [])

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          return new Notification(title, {
            icon: '/favicon.svg',
            ...options,
          })
        } catch (e) {
          console.warn('Browser notification failed:', e)
        }
      }
      return null
    },
    []
  )

  return { permission, requestPermission, sendNotification }
}
