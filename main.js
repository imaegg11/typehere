let print = (s) => { // Pov python user moment
    console.log(s); 
}

// Key Presses

let cmdPOpen = false;
let selected_index = 0;
let max_selected = 0

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
        switch (e.keyCode) {
            case 75: // K key
                cmdPToggle();
                e.preventDefault();
                break;
        }
    } else if (cmdPOpen) {
        switch (e.keyCode) {
            case 27:  // Esc key
                cmdPToggle();
                break;
            case 40: // Down arrow
                e.preventDefault();
                selected_index = Math.min(selected_index + 1, max_selected);
                handleSearch();
                break;
            case 38: // Up Arrow
                e.preventDefault();
                selected_index = Math.max(selected_index - 1, 0);
                handleSearch();
                break;
            default: 
                figureOutWhatToDo(e, selected_index)
                break;

        }
    } 

    // print(e);
});

// DB stuff

let db;
let note_keys = {};
let current_key = localStorage["current_key"];

let open_db = () => {
    const open_request = window.indexedDB.open("main", 1);
    
    open_request.onsuccess = (e) => {
        db = e.target.result;
        updateNoteKeys();
        updateTextArea();
    }

    open_request.onerror = (e) => {
        console.error("Error opening IndexedDB");
        console.error(e);
    }
    
    open_request.onupgradeneeded = (e) => {
        db = e.target.result;
        const storeOS = db.createObjectStore("storage", {keyPath: "key"});
        
        e.target.transaction.oncomplete = (e) => {
            create_note("default");
            current_key = Object.keys(note_keys)[0];
            localStorage["current_key"] = current_key;
        }
    }
}

let writeToStorageNoteKeys = () => {
    let item = {
        "key": "keys",
        "content": note_keys
    }

    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.put(item);

    request.onerror = (e) => {
        console.error(e);
    }
}

let writeToStorageContent = (key, name, text) => {
    let item = {
        "key": key,
        "name": name,
        "content": text 
    }

    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.put(item);

    request.onerror = (e) => {
        console.error(e);
    }
}

let readFromStorage = (key) => {
    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.get(key);

    return request
}

let deleteFromStorage = (key) => {
    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.delete(key);

    request.onerror = (e) => {
        console.error(e);
    }
}

let updateStorage = () => {
    let textarea = document.getElementById("textarea");
    writeToStorageContent(current_key, note_keys[current_key], textarea.value);
}

let updateTextArea = () => {
    let textarea = document.getElementById("textarea");
    let request = readFromStorage(current_key);

    request.onsuccess = (e) => {
        textarea.value = e.target.result.content;
    }

    request.onerror = (e) => {
        console.error(e);
    }
}

let find_default = () => {
    let keys = Object.keys(note_keys).map((e) => { 
        return parseInt(e);
    });

    return Math.min(...keys).toString();
}

let change_current_note = (key) => {
    current_key = key;
    localStorage["current_key"] = current_key;
    updateTextArea();
}

let delete_note = (key) => {
    
    default_key = find_default()
    if (key == default_key) {
        writeToStorageContent(default_key, note_keys[default_key], "");
        updateTextArea();
        return
    }

    delete note_keys[key]
    deleteFromStorage(key);

    writeToStorageNoteKeys();
    change_current_note(find_default());
}

let create_note = (name) => {
    let key = Date.now().toString();
    writeToStorageContent(key, name, "");
    note_keys[key] = name;
    writeToStorageNoteKeys();

    change_current_note(key);
}

let updateNoteKeys = () => {
    let request = readFromStorage("keys");

    request.onsuccess = (e) => {
        note_keys = e.target.result.content;
        if (localStorage["current_key"] == null) {
            current_key = find_default();
            localStorage["current_key"] = current_key;
        }
    }
}

// Modal 

let cmdPToggle = () => {
    let cmdP = document.getElementById("cmdP");
    let inp = document.getElementById("cmdP-input")
    if (cmdP.open) {
        cmdP.close();
        inp.value = ""
        document.activeElement.blur();
        document.getElementById("textarea").focus();
    } else {
        selected_index = 0;
        handleSearch();
        cmdP.showModal();
    }

    cmdP.classList.toggle("hidden");
    cmdPOpen = !cmdPOpen;
}       

let handleSearch = () => {
    let notes = findNotes();
    let commands = findCommands();
    let total = [...notes, ...commands];

    if (max_selected == -1) {
        selected_index = 0;
    }
    
    max_selected = total.length - 1;

    if (selected_index > max_selected) {
        selected_index = total.length - 1;
    }

    addToCmdP(total);
}

let findNotes = () => {
    let search = document.getElementById("cmdP-input");
    let notes = [];
    if (search.value == "") {
        for (let key of Object.keys(note_keys)) {
            notes.push([]);
            notes[notes.length - 1].push(key);
            notes[notes.length - 1].push(note_keys[key])
        }
    } else {
        for (let key of Object.keys(note_keys)) {
            if (note_keys[key].includes(search.value)) {
                notes.push([]);
                notes[notes.length - 1].push(key);
                notes[notes.length - 1].push(note_keys[key])
            }
        }
    }

    return notes
}

let switch_theme = () => {
    document.body.classList.toggle("light");
    document.body.classList.toggle("dark");
    
    document.getElementById("cmdP-input").classList.toggle("cmdP-input-dark");
    document.getElementById("cmdP-input").classList.toggle("cmdP-input-light");

    let root = document.documentElement;
    let cur = getComputedStyle(root).getPropertyValue("--selected-value");
    root.style.setProperty("--selected-value", cur == "0" ? "255" : "0");

    localStorage["isLightTheme"] = document.body.classList.contains("light");
}

let findCommands = () => {
    let search = document.getElementById("cmdP-input")
    let searchCmds = [
        [">toggle theme", `Toggle ${document.body.classList.contains("light") ? "Dark" : "Light"} Mode`, switch_theme]
    ];

    let returnCmds = []

    if (search.value != "") {
        if (search.value[0] != ">") {
            returnCmds.push([">create", "Create Note: " + search.value, create_note]);
        }
        
        for (let cmd of searchCmds) {
            if (search.value[0] == ">" && cmd[1].toLowerCase().includes(search.value.substring(1).toLowerCase())) {
                returnCmds.push(cmd);
            }
        }
    }


    return returnCmds 
}

let addToCmdP = (notes) => {
    let notesArea = document.getElementById("notes");

    notesArea.innerHTML = "";

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];

        let div = document.createElement("div");
        div.classList.add("note");

        if (i == selected_index) {
            div.classList.add("color-selected")
        }
        
        let name = document.createElement("p");
        name.innerText = note[1];
        name.classList.add("note-name");
        div.appendChild(name);

        if (note[0][0] != ">") {
            let date = document.createElement("p");
            date.innerText = new Date(parseInt(note[0])).toDateString().substring(4)
            date.classList.add("note-creation-date");
            div.appendChild(date);
        }

        notesArea.appendChild(div);
    }

    notesArea.children[selected_index].scrollIntoView();    
}

let figureOutWhatToDo = (e, selected_index) => {
    let search = document.getElementById("cmdP-input");
    let total = [...findNotes(), ...findCommands()];
    let selected = total[selected_index];
    let keyCode = e.keyCode;

    if (keyCode == 13) {
        if (selected[0][0] != ">") {
            change_current_note(selected[0]);
        } else {
            switch (selected[0]) {
                case ">create": 
                    selected[2](search.value);
                    break;
                default:
                    selected[2]();
                    break;
            }
        }

        cmdPToggle();
    } else if (selected[0][0] != ">" && e.altKey && (keyCode == 46 || keyCode == 8)) {
        delete_note(selected[0]);
        cmdPToggle();
    }

}

// Tabs 

let add_tab = (e) => {

}

// Settings 

let check_settings = () => {
    required_settings = [["isLightTheme", true]]
    for (let setting of required_settings) {
        if (localStorage[setting[0]] == null) {
            localStorage[setting[0]] = setting[1]
        }
    }
}

// Onload

window.onload = (e) => {

    check_settings()

    if (localStorage["isLightTheme"] === "false") {
        switch_theme();
    }


    open_db();
}