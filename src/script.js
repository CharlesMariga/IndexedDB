import { uid } from "./uid";
import { state } from "./data.js";

const IDB = (() => {
  let db = null;
  let objectStore = null;
  let DBOpenReq = null;

  DBOpenReq = indexedDB.open("WhiskeyDB", 1);

  DBOpenReq.addEventListener("error", (err) => {
    console.warn(err);
  });

  DBOpenReq.addEventListener("success", (e) => {
    db = e.target.result;
    console.log("Success: ", db);

    if (state) {
      const tx = makeTx("whiskeyStore", "readwrite");
      tx.oncomplete = () => {
        console.log("Finishing adding data");
        buildList();
      };
      const store = tx.objectStore("whiskeyStore");

      /**
       * If you go in the route of deleting all before insert
       * here are some of the methods you can use:
       * - store.clear() // deletes all
       * - store.delete(key) // deletes by key
       * - store.delete(IDBKeyRange.lowerBound(0)) // deletes all with key >= 0
       * - store.delete(IDBKeyRange.upperBound(0)) // deletes all with key <= 0
       * - store.delete(IDBKeyRange.bound(0, 100)) // deletes all with key >= 0 and key <= 100
       * - store.delete(IDBKeyRange.only(0)) // deletes all with key === 0
       * - store.delete(IDBKeyRange.lowerBound(0, true)) // deletes all with key > 0
       * - store.delete(IDBKeyRange.upperBound(0, true)) // deletes all with key < 0
       * - store.delete(IDBKeyRange.bound(0, 100, true, true)) // deletes all with key > 0 and key < 100
       * - store.delete(IDBKeyRange.bound(0, 100, true, false)) // deletes all with key > 0 and key <= 100
       * - store.delete(IDBKeyRange.bound(0, 100, false, true)) // deletes all with key >= 0 and key < 100
       * - store.delete(IDBKeyRange.bound(0, 100, false, false)) // deletes all with key >= 0 and key <= 100
       */

      const request = store.getAll();
      request.onsuccess = (e) => {
        if (e.target.result.length === 0) {
          state.forEach((item) => {
            const req = store.add(item);
            req.onsuccess = () => {
              console.log("Added an object");
            };
            req.onerror = () => {
              // transaction.abort(); - kills the transaction
              tx.abort();
              console.warn(err);
            };
          });
        }
      };

      request.onerror = (e) => {};
    } else {
      buildList();
    }
  });

  DBOpenReq.addEventListener("upgradeneeded", (e) => {
    db = e.target.result;
    console.log("Upgrade: ", db);
    if (db.objectStoreNames.contains("whiskeyStore")) {
      db.deleteObjectStore("whiskeyStore");
    }

    // Create an objectStore for this database
    objectStore = db.createObjectStore("whiskeyStore", { keyPath: "id" });

    // Add the indexes
    objectStore.createIndex("nameIDX", "name", { unique: false });
    objectStore.createIndex("countryIDX", "country", { unique: false });
    objectStore.createIndex("ageIDX", "age", { unique: false });
    objectStore.createIndex("editIDX", "lastEdit", { unique: false });
  });

  const makeTx = (storeName, mode) => {
    const tx = db.transaction(storeName, mode);
    tx.onerror = (err) => {
      console.warn(err);
    };
    return tx;
  };

  const clearForm = (e) => {
    if (e) e.preventDefault();
    document.WhiskyForm.reset();
  };

  const buildList = (e) => {
    const list = document.querySelector(".wlist");
    list.innerHTML = "<li>Loading...</li>";
    const tx = makeTx("whiskeyStore", "readonly");
    tx.oncomplete = (e) => {};
    const store = tx.objectStore("whiskeyStore");

    /**
     * Version (1)
     * Getting all from the store
     */
    // const getReq = store.getAll();

    /**
     * Version (2)
     * Getting all with key range and index
     */
    // const range = IDBKeyRange.lowerBound(14, true); // 14 or higher...if true, 15 or higher
    // const range = IDBKeyRange.bound(1, 10, false, false);
    // const idx = store.index("ageIDX");
    // const getReq = idx.getAll(range);

    /**
     * Version (1) and version (2) are return an
     * array of list items (whiskeys)
     */
    // getReq.onsuccess = (e) => {
    //   const request = e.target; // request === getReq === e.target
    //   console.log({ request });
    //   list.innerHTML = request.result
    //     .map(
    //       (whiskey) =>
    //         `<li data-key="${whiskey.id}"><span>${whiskey.name}</span> ${whiskey.age}</li>`
    //     )
    //     .join("\n");
    // };
    // getReq.onerror = (err) => {
    //   console.warn(err);
    // };

    /**
     * Version (3)
     *
     */
    const index = store.index("nameIDX");
    /**
     * Using strings as bounds is case sensitive therefore
     * A-Z comes before a-z
     */
    const range = IDBKeyRange.bound("A", "Z", false, false);
    list.innerHTML = "";
    // IDBCursorDirection -> next, nextunique, prev, prevunique
    index.openCursor(range, "prevunique").onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        console.log(
          cursor.source.objectStore.name,
          cursor.source.name,
          cursor.direction,
          cursor.key,
          cursor.primaryKey,
          cursor.value
        );

        let whiskey = cursor.value;
        list.innerHTML += `<li data-key="${whiskey.id}"><span>${whiskey.name}</span> ${whiskey.age}</li>`;

        cursor.continue(); // calls the onsuccess method again
      } else {
        console.log("End of cursor");
      }
    };
  };

  document.getElementById("btnAdd").addEventListener("click", (e) => {
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
      lastEdit: Date.now(),
    };

    const tx = makeTx("whiskeyStore", "readwrite");
    tx.oncomplete = (e) => {
      console.log(e);
      buildList();
      clearForm();
    };

    const store = tx.objectStore("whiskeyStore");
    const request = store.add(whiskey);

    request.onsuccess = () => {
      console.log("Successfully added and object to the store");
    };

    request.onerror = () => {
      console.warn("Error in request to add");
    };
  });

  document.getElementById("btnClear").addEventListener("click", clearForm);

  document.querySelector(".wlist").addEventListener("click", (e) => {
    const id = e.target.closest("li").dataset.key;
    const tx = makeTx("whiskeyStore", "readonly");
    tx.oncomplete = (e) => {
      console.log(e);
      buildList();
    };
    const store = tx.objectStore("whiskeyStore");
    const req = store.get(id);
    req.onsuccess = (e) => {
      const request = e.target;
      const whiskey = request.result;
      document.getElementById("name").value = whiskey.name;
      document.getElementById("country").value = whiskey.country;
      document.getElementById("age").value = whiskey.age;
      document.getElementById("isOwned").checked = whiskey.owned;
      document.WhiskyForm.setAttribute("data-key", whiskey.id);
    };

    req.onerror = (err) => {
      console.log(err);
    };
  });

  document.getElementById("btnUpdate").addEventListener("click", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const country = document.getElementById("country").value.trim();
    const age = parseInt(document.getElementById("age").value);
    const owned = document.getElementById("isOwned").checked;
    const key = document.WhiskyForm.dataset.key;

    if (key) {
      const whiskey = {
        id: key,
        name,
        country,
        age,
        owned,
        lastEdit: Date.now(),
      };

      const tx = makeTx("whiskeyStore", "readwrite");
      tx.oncomplete = (e) => {
        console.log(e);
        buildList();
        clearForm();
      };

      const store = tx.objectStore("whiskeyStore");
      const request = store.put(whiskey);

      request.onsuccess = () => {
        console.log("Successfully updated and object");
      };

      request.onerror = () => {
        console.warn("Error in request to update");
      };
    }
  });

  document.getElementById("btnDelete").addEventListener("click", (e) => {
    e.preventDefault();

    const key = document.WhiskyForm.dataset.key;

    if (key) {
      const tx = makeTx("whiskeyStore", "readwrite");
      tx.oncomplete = (e) => {
        console.log(e);
        buildList();
        clearForm();
      };

      const store = tx.objectStore("whiskeyStore");
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log("Successfully deleted an object");
      };
      request.onerror = () => {
        console.log("Error in request to delete");
      };
    }
  });
})();
