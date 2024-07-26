let print = (s) => { // Pov python user moment
    console.log(s); 
}

// Key Presses

let cmdPOpen = false;
let detailsOpen = true;
let selected_index = 0;
let max_selected = 0

let toggleDetails = () => {
    let bottom = document.getElementById("bottom");
    bottom.classList.toggle("height-zero");
    document.documentElement.style.setProperty('--bottom-height', detailsOpen ? "0rem" : "2.3rem");
    detailsOpen = !detailsOpen;
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
        switch (e.keyCode) {
            case 75: // K key
                cmdPToggle();
                e.preventDefault();
                break;
            case 66: // B Key
                toggleDetails();
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

let writeToStorageContent = (key, name, text, edited_data) => {
    let item = {
        "key": key,
        "name": name,
        "content": text,
        "last_edited": edited_data
    }

    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.put(item);

    request.onerror = (e) => {
        console.error(e);
    }
}

let update_name = () => {
    let name = document.getElementById("current-note-name")
    let v = name.value;

    let request = readFromStorage(current_key)

    request.onsuccess = (e) => {
        result = e.target.result;
        writeToStorageContent(result.key, v, result.content, result.last_edited);
        note_keys[result.key][0] = v;
        writeToStorageNoteKeys();
        print(note_keys)
    }

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
    let edit = Date.now();
    note_keys[current_key][1] = edit
    writeToStorageContent(current_key, note_keys[current_key][0], textarea.value, edit);
}

let updateTextArea = () => {
    let textarea = document.getElementById("textarea");
    let request = readFromStorage(current_key);

    request.onsuccess = (e) => {
        textarea.value = e.target.result.content;
        document.getElementById("current-note-name").value = note_keys[current_key][0]
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
        writeToStorageContent(default_key, note_keys[default_key][0], "", Date.now());
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
    let edit = Date.now()
    writeToStorageContent(key, name, "", edit);
    note_keys[key] = [name, edit];
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
        document.activeElement.blur();
        setTimeout(() => {
            document.getElementById("cmdP-input").focus();
        }, 0);
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

    for (let key of Object.keys(note_keys)) {
        if (search.value == "" || note_keys[key][0].includes(search.value)) {
            print(note_keys)
            notes.push([]);
            notes[notes.length - 1].push(key);
            notes[notes.length - 1].push(note_keys[key][0])
            notes[notes.length - 1].push(note_keys[key][1])
        }
    }

    return notes
}

let set_theme = (theme) => {

    let themes = {
        "light":{
            "text": "#0f0f0f",
            "bg": "#f2f3f5",
            "search-bg": "#dfe0e2",
            "selected-bg": "rgba(0, 0, 0, 0.1)",
        }, 
        "dark": {
            "text": "#cacaca",
            "bg": "#2b2d31",
            "search-bg": "#1c1d1e",
            "selected-bg": "rgba(255, 255, 255, 0.1)"
        }
    }

    let root = document.documentElement;
    for (let key of Object.keys(themes[theme])) {
        root.style.setProperty("--" + key, themes[theme][key]);
    }
}

let switch_theme = () => {
    
    localStorage["isLightTheme"] = (localStorage["isLightTheme"] == "true" ? "false" : "true")
    let theme = localStorage["isLightTheme"] == "true" ? "light" : "dark"

    set_theme(theme)

}

let findCommands = () => {
    let search = document.getElementById("cmdP-input")
    let searchCmds = [
        [">toggle theme", `Toggle ${localStorage["isLightTheme"] == "true" ? "Dark" : "Light"} Mode`, switch_theme]
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
            date.innerText = `${new Date(parseInt(note[2])).toLocaleString().split(", ")[1]} ${new Date(parseInt(note[2])).toDateString().substring(4)} - ${new Date(parseInt(note[0])).toDateString().substring(4)}`
            date.classList.add("note-creation-date");
            div.appendChild(date);
        }

        notesArea.appendChild(div);
    }

    if (selected_index != -1) {
        notesArea.children[selected_index].scrollIntoView();    
    }
}

let figureOutWhatToDo = (e, selected_index) => {   
    let search = document.getElementById("cmdP-input");
    let total = [...findNotes(), ...findCommands()];
    let selected = total[selected_index];

    if (selected == undefined) {
        return;
    }

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

    document.getElementById("textarea").focus();
    toggleDetails();

    check_settings()
    if (localStorage["isLightTheme"] === "false") {
        set_theme("dark");
    }

    open_db();
}