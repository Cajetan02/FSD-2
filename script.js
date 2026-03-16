let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let editIndex = null;

displayContacts();

function addContact() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;

    if (name === "" || email === "" || phone === "") {
        alert("All fields are required");
        return;
    }

    let contact = { name, email, phone };

    if (editIndex === null) {
        contacts.push(contact);
    } else {
        contacts[editIndex] = contact;
        editIndex = null;
    }

    localStorage.setItem("contacts", JSON.stringify(contacts));
    clearForm();
    displayContacts();
}

function displayContacts() {
    let list = document.getElementById("contactList");
    list.innerHTML = "";

    contacts.forEach((contact, index) => {
        list.innerHTML += `
            <p>
                <b>Name:</b> ${contact.name} <br>
                <b>Email:</b> ${contact.email} <br>
                <b>Phone:</b> ${contact.phone} <br>
                <button onclick="editContact(${index})">Edit</button>
                <button onclick="deleteContact(${index})">Delete</button>
            </p>
            <hr>
        `;
    });
}

function deleteContact(index) {
    contacts.splice(index, 1);
    localStorage.setItem("contacts", JSON.stringify(contacts));
    displayContacts();
}

function editContact(index) {
    let contact = contacts[index];

    document.getElementById("name").value = contact.name;
    document.getElementById("email").value = contact.email;
    document.getElementById("phone").value = contact.phone;

    editIndex = index;
}

function clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
}
