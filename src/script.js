import { uid } from "./uid";

const IDB = (() => {
  let db = null;
  let objectStore = null;
  let DBOpenReq = null;

  DBOpenReq = indexedDB.open("WhiskeyDB", 1);

  DBOpenReq.addEventListener("error", (event) => {
    console.warn(err);
  });

  DBOpenReq.addEventListener("success", (e) => {
    db = e.target.result;
    console.log("Success: ", db);
  });

  DBOpenReq.addEventListener("upgradeneeded", (e) => {
    db = e.target.result;
    console.log("Upgrade: ", db);
    if (!db.objectStoreNames.contains("whiskeyStore")) {
      objectStore = db.createObjectStore("whiskeyStore", { keyPath: "id" });
    }
  });

  const makeTx = (storeName, mode) => {
    const tx = db.transaction(storeName, mode);
    tx.onerror = (err) => {
      console.warn(err);
    };
    return tx;
  };

  document.WhiskyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const country = document.getElementById("country").value.trim();
    const age = parseInt(document.getElementById("age").value);
    const owned = document.getElementById("isOwned").checked;

    const whiskey = {
      id: uid(),
      name,
      country,
      age,
      owned,
    };

    const tx = makeTx("whiskeyStore", "readwrite");
    tx.oncomplete = (e) => {
      console.log(e);
    };

    const store = tx.objectStore("whiskeyStore");
    const request = store.add(whiskey);
  });
})();
