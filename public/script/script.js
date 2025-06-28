const MENU_DELAY = 200;
const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
const modal = document.querySelector(".modal")
const modalContainer = document.querySelector(".modal-container")
const modalContent = document.querySelector(".modal-content")

const linksRoutes = document.querySelectorAll(".link.link-route")
linksRoutes[linksRoutes.length - 1].classList.toggle("last")

dropdownToggles.forEach(button => {
    button.addEventListener("click", (event) => {
        const menu = button.nextElementSibling;

        document.querySelectorAll(".dropdown-menu.show").forEach(openMenu => {
            if (openMenu !== menu) {
                openMenu.classList.remove("show");
                setTimeout(() => openMenu.style.left = "", MENU_DELAY);
            }
        });

        menu.classList.toggle("show")

        if (menu.classList.contains("show")) {
            requestAnimationFrame(() => {
                const menuRect = menu.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();

                const overflowRight = menuRect.right > window.innerWidth;

                if (overflowRight) {
                    const shiftAmount = menuRect.right - buttonRect.right;
                    menu.style.left = `-${shiftAmount}px`;
                } else {
                    menu.style.left = "";
                }
            });
        } else {
            setTimeout(() => {
                menu.style.left = "";
            }, MENU_DELAY);
        }

        event.stopPropagation();
    });
});

document.addEventListener("click", event => {
    document.querySelectorAll(".dropdown-menu.show").forEach(openMenu => {
        if (!openMenu.contains(event.target)) {
            openMenu.classList.remove("show")
            setTimeout(() => openMenu.style.left = "", MENU_DELAY);
        }
    })
})

const showModal = (data) => {
    if (data.action === "info") {
        folderInfo(data)
    } else if (data.action === "edit") {
        editModal(data)
    }
    
    document.querySelectorAll(".dropdown-menu.show").forEach(openMenu => {
        openMenu.classList.toggle("show")
    })
}

const closeModal = () => {
    modalContent.textContent = "";
    modal.style.display = "none"
}

const infoTab = (tabName, tabInfo) => {
    const infoContainer = document.createElement("div")
    infoContainer.classList.add("info-tab")

    const tabNameContainer = document.createElement("p")
    const tab = document.createElement("span")
    tab.textContent = tabName
    tab.style.fontWeight = "bold"

    const tabInfoContainer = document.createElement("span")
    tabInfoContainer.textContent = tabInfo

    tabNameContainer.append(tab, tabInfoContainer)
    infoContainer.append(tabNameContainer)

    return infoContainer;
}

const formatDate = (dateString) => {
    const date = new Date(dateString)

    const formatDate = date.toLocaleDateString()
    const formatTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })

    return formatDate + ", " + formatTime;
}

const folderInfo = (data) => {
    modal.style.display = "flex"

    const infoToDisplay = []

    modalContent.style.display = "flex"
    modalContent.style.flexDirection = "column"
    modalContent.style.gap = "1rem"

    const folderIcon = document.createElement("img")
    folderIcon.src = (data.type === "folder" ? "/svg/folder-open-icon.svg" : "/svg/file-open-icon.svg")
    folderIcon.alt = `Open ${data.type === "folder" ? "folder" : "file"} icon`
    folderIcon.style.width = "60px"
    folderIcon.style.alignSelf = "center"

    const folderName = document.createElement("h2")
    folderName.textContent = data.name
    folderName.classList.add("info-folder-title")

    infoToDisplay.push(folderIcon, folderName)
    
    const createdAtDate = formatDate(data.createdAt)
    const updatedAtDate = formatDate(data.updatedAt)
    
    if (data.type === "file") {
        const archive = infoTab("Type: ", data.archive)
        const sizeInfo = infoTab("Size: ", formatFileSize(Number(data.size)))
        infoToDisplay.push(archive, sizeInfo)
    }
    
    const createdInfo = infoTab("Created at: ", createdAtDate)
    const updatedInfo = infoTab("Updated at: ", updatedAtDate)
    infoToDisplay.push(createdInfo, updatedInfo)

    modalContent.append(...infoToDisplay)
}

function formatFileSize(size) {
    const units = ["bytes", "KB", "MB", "GB", "TB"]
    let i = 0;

    while (size >= 1000 && i < units.length - 1) {
        size /= 1000;
        i++;
    }

    return `${size.toFixed(2)} ${units[i]}`
}

const editModal = (data) => {
    modal.style.display = "flex"
    
    const form = document.createElement("form")
    form.classList.add("form")
    form.method = "post"
    form.action = (data.type === "folder" ? `/uploads/${data.id}/edit` : `/uploads/file/${data.id}/edit`)

    const formItem = document.createElement("div")
    formItem.classList.add("form-item")

    const label = document.createElement("label")
    label.textContent = "Change name"
    label.htmlFor = "folder-name"

    const input = document.createElement("input")
    input.classList.add("input", "input-form")
    input.type = "text"
    input.name = "folder-name"
    input.id = "folder-name"
    input.value = data.name

    const button = document.createElement("button")
    button.classList.add("btn", "submit-btn")
    button.type = "submit"
    button.textContent = "Edit"

    formItem.append(label, input)
    form.append(formItem)

    if (data.error) {
        const error = document.createElement("span");
        error.classList.add("error", "msg");
        error.textContent = data.error;
        form.append(error);
    }

    form.append(button)
    modalContent.append(form)

    setTimeout(() => {
        input.select()
        input.focus()
    }, 0)
}

const newFolder = (parentFolder, errorMessage = "", oldInput = "") => {
    modal.style.display = "flex"

    const form = document.createElement("form")
    form.classList.add("form")
    form.method = "post"
    form.action = `/uploads/${parentFolder ? parentFolder + "/" : ""}create`

    const formItem = document.createElement("div")
    formItem.classList.add("form-item")

    const label = document.createElement("label")
    label.textContent = "New folder"
    label.htmlFor = "folder-name"

    const input = document.createElement("input")
    input.classList.add("input", "input-form")
    input.type = "text"
    input.name = "folder-name"
    input.id = "folder-name"
    input.placeholder = "Enter a name"
    input.value = oldInput

    const error = document.createElement("span");
    error.classList.add("error", "msg");
    error.textContent = errorMessage;

    const button = document.createElement("button")
    button.classList.add("btn", "submit-btn")
    button.type = "submit"
    button.textContent = "Add folder"

    formItem.append(label, input)
    form.append(formItem)
    if (errorMessage) form.append(error);
    form.append(button)
    modalContent.append(form)

    setTimeout(() => {
        input.focus()
    }, 0)
}

const newFile = (parentFolder, errorMessage="") => {
    modal.style.display = "flex"

    const form = document.createElement("form")
    form.classList.add("form")
    form.method = "post"
    form.action = `/uploads/${parentFolder ? parentFolder + "/file" : "file"}`
    form.enctype = "multipart/form-data"

    const formItem = document.createElement("div")
    formItem.classList.add("form-item")

    const label = document.createElement("label")
    label.textContent = "New file"
    label.htmlFor = "file"

    const input = document.createElement("input")
    input.classList.add("input", "input-form", "file-input")
    input.type = "file"        
    input.name = "file"

    const error = document.createElement("span");
    error.classList.add("error", "msg");
    error.textContent = errorMessage;

    const button = document.createElement("button")
    button.classList.add("btn", "submit-btn")
    button.type = "submit"
    button.textContent = "Add file"

    formItem.append(label, input)
    form.append(formItem)
    if (errorMessage) form.append(error)
    form.append(button)
    modalContent.append(form)
}

    const shareFolder = (parentFolder, shareLink = null) => {
    const durations = [
        { label: "1 hour", value: "1" },
        { label: "3 hours", value: "3" },
        { label: "1 day", value: "24" },
        { label: "3 days", value: "72" },
        { label: "10 days", value: "240" }
    ];

    modal.style.display = "flex"
    
    const form = document.createElement("form")
    form.classList.add("form")
    form.method = "post"
    form.action = `/public/${parentFolder}`

    const legend = document.createElement("label")
    legend.textContent = "Select link's duration"
    form.append(legend)

    const buttonGroup = document.createElement('div');
    buttonGroup.className = "button-group";

    durations.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = "duration-option";

        const input = document.createElement('input');
        input.type = "radio";
        input.name = "duration";
        input.id = `duration-${index}`;
        input.value = option.value;

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = option.label;

        div.appendChild(input);
        div.appendChild(label);
        buttonGroup.appendChild(div);

        if (shareLink) {
            input.disabled = true;
            label.classList.add("disabled");
        }
        if (!shareLink && option.value === "24") {
            input.checked = true;
        }
    });


    const button = document.createElement("button")
    button.classList.add("btn", "submit-btn")
    button.type = "submit"
    button.textContent = "Share"
    if (shareLink) {
        button.disabled = true;
        button.classList.add("disabled");
    }

    form.append(buttonGroup, button)
    modalContent.append(form)

    if (shareLink) {
        const copyContainer = document.createElement("div");
        copyContainer.classList.add("copy-container");

        const linkDisplay = document.createElement("div");
        linkDisplay.classList.add("share-link");
        linkDisplay.textContent = shareLink;

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        copyButton.type = "button";
        copyButton.classList.add("btn", "add-new", "share-btn");

        copyButton.addEventListener("click", () => {
            navigator.clipboard.writeText(shareLink);
            copyButton.textContent = "Copied!";
            setTimeout(() => (copyButton.textContent = "Copy"), 2000);
        });

        copyContainer.append(linkDisplay, copyButton);
        modalContent.append(copyContainer);
    }
}

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal()
    }
})