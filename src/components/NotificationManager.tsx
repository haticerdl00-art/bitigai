
import React, { useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getCalendarItems } from '../utils/calendarUtils';
import { MEVZUAT_DATA } from '../data/legislationData';
import { sendNotification, shouldNotify, requestNotificationPermission } from '../utils/notificationUtils';
import { showToast } from './NotificationToast';

/**
 * Global component that monitors conditions across modules and triggers notifications.
 */
export const NotificationManager: React.FC = () => {
  useEffect(() => {
    // Request permission on first mount
    requestNotificationPermission();

    const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const todayISO = new Date().toISOString().split('T')[0];

    // 1. Check Legislation (Mevzuat)
    const newLegislation = MEVZUAT_DATA.find(m => m.tarih === todayStr);
    if (newLegislation && shouldNotify(`legislation_${newLegislation.id}`)) {
      sendNotification('Yeni Mevzuat Yayınlandı!', {
        body: newLegislation.baslik,
        tag: `leg_${newLegislation.id}`
      });
      showToast('Yeni Mevzuat Yayınlandı!', newLegislation.baslik, 'legislation');
    }

    // 2. Check Calendar (Mali Takvim)
    // We check for items due TODAY
    const calendarItems = getCalendarItems(new Date());
    const dueToday = calendarItems.filter(item => {
      const itemDateStr = item.date.toISOString().split('T')[0];
      return itemDateStr === todayISO;
    });

    dueToday.forEach(item => {
      if (shouldNotify(`calendar_${item.id}`)) {
        sendNotification('Beyanname Son Günü!', {
          body: `${item.title}: Bugun bildirim için son gün.`,
          tag: `cal_${item.id}`
        });
        showToast('Beyanname Son Günü!', `${item.title}: Bugun son gün.`, 'calendar');
      }
    });

    // 3. Check Tasks (Görevler)
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const q = query(tasksRef, where('date', '==', todayISO), where('completed', '==', false));

      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(doc => {
          const task = doc.data();
          if (shouldNotify(`task_${doc.id}`)) {
            sendNotification('Görev Hatırlatıcı', {
              body: task.text,
              tag: `task_${doc.id}`
            });
            showToast('Görev Hatırlatıcı', task.text, 'task');
          }
        });
      });

      return () => unsubscribeTasks();
    });

    return () => unsubscribeAuth();
  }, []);

  return null;
};
