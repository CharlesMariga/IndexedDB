let initDB = null;
const openRequest = window.indexedDB.open("InitDB", 1);

openRequest.onupgradeneeded = (e) => {
  console.log("Upgrade needed");

  const newVersion = e.target.result;
  if (!newVersion.objectStoreNames.contains("InitDB")) {
    newVersion.createObjectStore("courses", { autoIncrement: true });
  }
};

openRequest.onerror = openRequest.onblocked = console.log;

openRequest.onsuccess = (e) => {
  console.log("Database open");
  initDB = e.target.result;
};

const deleteDatabase = () => {
  if (init) {
    console.log("Closing the database");
    initDB.close();
    console.log("Attempting to delete the database");
    const deleteRequest = window.indexedDB.deleteDatabase("InitDB");
    deleteRequest.onsuccess = () => {
      console.log("Database deleted");
      initDB = null;
    };
    deleteRequest.onerror = deleteRequest.onblocked = console.log;
  } else {
    console.log("You must first create a database before deleting it");
  }
};

let db = {
  name: "CrudDB",
  version: 1,
  instance: {},
  storeNames: {
    courses: "courses",
  },
  defaultErrorHandler(e) {
    console.log(e);
  },
  setDefaultErrorHandler() {
    if ("onerror" in request) request.onerror = db.defaultErrorHandler;
    if ("onblocked" in request) request.onblocked = db.defaultErrorHandler;
  },
};
