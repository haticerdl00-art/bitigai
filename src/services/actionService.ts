
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';

export const handleAssistantAction = async (action: any, userId: string, companies: any[]) => {
  console.log("Assistant Action Detected:", action);
  
  if (action.type === 'ADD_NOTE') {
    const { company, content } = action;
    
    if (company === 'Genel') {
      const settingsRef = doc(db, 'users', userId, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      const currentNotes = settingsSnap.exists() ? settingsSnap.data().general_notes || "" : "";
      await setDoc(settingsRef, { 
        general_notes: currentNotes + (currentNotes ? "\n" : "") + content,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      const targetCompany = companies.find(f => f.name.toLowerCase().includes(company.toLowerCase()));
      if (targetCompany) {
        const companyRef = doc(db, 'companies', targetCompany.id);
        const companySnap = await getDoc(companyRef);
        const currentNotes = companySnap.exists() ? companySnap.data().notes || "" : "";
        await updateDoc(companyRef, { 
          notes: currentNotes + (currentNotes ? "\n" : "") + content,
          updatedAt: serverTimestamp()
        });
      }
    }
  } else if (action.type === 'UPDATE_DECLARATION') {
    const { company, declaration, status } = action;
    const targetCompany = companies.find(f => f.name.toLowerCase().includes(company.toLowerCase()));
    if (targetCompany) {
      const field = declaration.toLowerCase() === 'berat' ? 'berat' : 
                    declaration.toLowerCase() === 'kdv' ? 'kdv' : 
                    declaration.toLowerCase() === 'muhsgk' || declaration.toLowerCase() === 'muhtasar' ? 'muhtasar' : 
                    declaration.toLowerCase() === 'geçici' ? 'gecici' : null;
      if (field) {
        const companyRef = doc(db, 'companies', targetCompany.id);
        await updateDoc(companyRef, { 
          [field]: status,
          updatedAt: serverTimestamp()
        });
      }
    }
  } else if (action.type === 'ADD_TASK') {
    const { content, date } = action;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    await addDoc(tasksRef, {
      text: content,
      date: date || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: serverTimestamp(),
    });
  }
};
