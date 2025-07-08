const { doc, getDoc, setDoc } = window.firestoreFunctions;
const db = window.firestoreDB;

const firestoreDocRef = doc(db, 'notes', 'sharedNoteTabs');

let data = {};
const tabs = ["Create", "Work", "Health", "Chores"];
let activeTab = "Create";

async function loadData() {
    try {
        const docSnap = await getDoc(firestoreDocRef);
        const local = localStorage.getItem('tabNotes');

        if (local) {
            data = JSON.parse(local);
        } else if (docSnap.exists()) {
            data = docSnap.data().data || {};
            saveLocal();
        } else {
            initializeTabs();
        }
    } catch (e) {
        console.error(e);
        const local = localStorage.getItem('tabNotes');
        if (local) {
            data = JSON.parse(local);
        } else {
            initializeTabs();
        }
    }
    render();
}

function initializeTabs() {
    tabs.forEach(tab => {
        data[tab] = {
            tasks: [],
            notes: []
        };
    });
    saveLocal();
}

function saveLocal() {
    localStorage.setItem('tabNotes', JSON.stringify(data));
    setDoc(firestoreDocRef, { data: data }).catch(e => console.error(e));
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function render() {
    $('#titles-container .tab-title').removeClass('active');
    $(`#titles-container .tab-title[data-tab="${activeTab}"]`).addClass('active');

    const content = $('#content-container');
    content.empty();

    const tasks = data[activeTab].tasks || [];
    const notes = data[activeTab].notes || [];

    // Render tasks
    tasks.forEach(task => {
        const taskDiv = $('<div>').addClass('task-item');

        const checkbox = $('<div>').addClass('item-checkbox');
        checkbox.on('click', () => {
            data[activeTab].tasks = tasks.filter(t => t.id !== task.id);
            saveLocal();
            render();
        });

        const text = $('<div contenteditable="true">').addClass('item-text').text(task.text);
        text.on('input', () => {
            task.text = text.text();
            saveLocal();
        });

        taskDiv.append(checkbox, text);
        content.append(taskDiv);
    });

    // Add + button BELOW tasks
    const addTaskBtn = $('<button>').addClass('control-btn').text('+');
    addTaskBtn.on('click', () => {
        const newTask = { id: generateId(), text: '' };
        tasks.push(newTask); // push → appears above +
        saveLocal();
        render();
        focusItem(newTask.id, 'task');
    });
    content.append(addTaskBtn);

    // Add // button ABOVE notes
    const addNoteBtn = $('<button>').addClass('control-btn').text('//');
    addNoteBtn.on('click', () => {
        const newNote = { id: generateId(), text: '' };
        notes.unshift(newNote); // unshift → appears right after //
        saveLocal();
        render();
        focusItem(newNote.id, 'note');
    });
    content.append(addNoteBtn);

    // Render notes BELOW //
    notes.forEach(note => {
        const noteDiv = $('<div>').addClass('note-item');

        const text = $('<div contenteditable="true">').addClass('item-text').text(note.text);
        text.on('input', () => {
            note.text = text.text();
            saveLocal();
        });

        noteDiv.append(text);
        content.append(noteDiv);
    });

    // Add - button BELOW notes
    const clearNotesBtn = $('<button>').addClass('control-btn').text('-');
    clearNotesBtn.on('click', () => {
        data[activeTab].notes = [];
        saveLocal();
        render();
    });
    content.append(clearNotesBtn);
}




$('#titles-container').on('click', '.tab-title', function () {
    activeTab = $(this).data('tab');
    render();
});

loadData();

function focusItem(id, type) {
    setTimeout(() => {
        const selector = type === 'task' ? '.task-item .item-text' : '.note-item .item-text';
        $(selector).last().focus();
    }, 0);
}