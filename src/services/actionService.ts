
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, setDoc, increment } from 'firebase/firestore';

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
  } else if (action.type === 'ADD_COMPANY') {
    const { title, vkn, taxOffice, address, email, phone, ledgerType, legalStatus, sector } = action;
    const companiesRef = collection(db, 'companies');
    await addDoc(companiesRef, {
      ownerId: userId,
      title: title,
      name: title,
      vkn: vkn || '',
      taxOffice: taxOffice || '',
      address: address || '',
      email: email || '',
      phone: phone || '',
      kdv: 'Bekliyor',
      muhtasar: 'Bekliyor',
      gecici: 'Bekliyor',
      berat: 'Bekliyor',
      totalReceivable: 0,
      totalCollected: 0,
      balance: 0,
      ledgerType: ledgerType || 'E-Defter (Bilanço)',
      legalStatus: legalStatus || 'LTD',
      sector: sector || 'Genel',
      hrProfile: {
        totalWorkers: 0,
        femaleWorkers: 0,
        maleWorkers: 0,
        personnelGroups: { retired: 0, disabled: 0, foreign: 0, apprentice: 0, management: 0 }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else if (action.type === 'ADD_PERSONNEL') {
    const { company, gender } = action;
    const targetCompany = companies.find(f => f.name.toLowerCase().includes(company.toLowerCase()));
    if (targetCompany) {
      const companyRef = doc(db, 'companies', targetCompany.id);
      const isFemale = gender === 'female';
      await updateDoc(companyRef, {
        'hrProfile.totalWorkers': increment(1),
        [isFemale ? 'hrProfile.femaleWorkers' : 'hrProfile.maleWorkers']: increment(1),
        updatedAt: serverTimestamp()
      });
    }
  } else if (action.type === 'ADD_COLLECTION') {
    const { company, amount } = action;
    const targetCompany = companies.find(f => f.name.toLowerCase().includes(company.toLowerCase()));
    if (targetCompany) {
      const companyRef = doc(db, 'companies', targetCompany.id);
      await updateDoc(companyRef, {
        totalCollected: increment(amount),
        balance: increment(-amount),
        updatedAt: serverTimestamp()
      });
    }
  }
};
