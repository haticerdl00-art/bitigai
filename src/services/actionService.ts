
export const handleAssistantAction = (action: any) => {
  console.log("Assistant Action Detected:", action);
  
  if (action.type === 'ADD_NOTE') {
    const { company, content } = action;
    const storedFirms = localStorage.getItem('beyanname_firms');
    if (storedFirms) {
      const firms = JSON.parse(storedFirms);
      const updatedFirms = firms.map((f: any) => {
        // If company is 'Genel', we might want to store it elsewhere or add to a specific 'Genel' firm if exists
        // For now, let's assume 'Genel' means adding to a general notes storage
        if (company === 'Genel') {
          // We'll handle general notes separately or just skip for now to avoid polluting all firms
          return f;
        }
        if (f.name.toLowerCase().includes(company.toLowerCase())) {
          return { ...f, notes: f.notes ? f.notes + "\n" + content : content };
        }
        return f;
      });
      
      if (company === 'Genel') {
        const generalNotes = localStorage.getItem('bitig_general_notes') || "";
        localStorage.setItem('bitig_general_notes', generalNotes + (generalNotes ? "\n" : "") + content);
      } else {
        localStorage.setItem('beyanname_firms', JSON.stringify(updatedFirms));
      }
      window.dispatchEvent(new Event('storage'));
    }
  } else if (action.type === 'UPDATE_DECLARATION') {
    const { company, declaration, status } = action;
    const storedFirms = localStorage.getItem('beyanname_firms');
    if (storedFirms) {
      const firms = JSON.parse(storedFirms);
      const updatedFirms = firms.map((f: any) => {
        if (f.name.toLowerCase().includes(company.toLowerCase())) {
          const field = declaration.toLowerCase() === 'berat' ? 'berat' : 
                        declaration.toLowerCase() === 'kdv' ? 'kdv' : 
                        declaration.toLowerCase() === 'muhsgk' || declaration.toLowerCase() === 'muhtasar' ? 'muhtasar' : 
                        declaration.toLowerCase() === 'geçici' ? 'gecici' : null;
          if (field) {
            return { ...f, [field]: status };
          }
        }
        return f;
      });
      localStorage.setItem('beyanname_firms', JSON.stringify(updatedFirms));
      window.dispatchEvent(new Event('storage'));
    }
  } else if (action.type === 'ADD_TASK') {
    const { content, date } = action;
    const storedTasks = localStorage.getItem('bitig_tasks');
    const tasks = storedTasks ? JSON.parse(storedTasks) : [];
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: content,
      date: date || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: Date.now(),
    };
    localStorage.setItem('bitig_tasks', JSON.stringify([newTask, ...tasks]));
    window.dispatchEvent(new Event('storage'));
  }
};
