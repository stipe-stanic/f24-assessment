## Test Database Seed Data

Every test runs against an isolated PostgreSQL container pre-seeded with the following data. Use these exact names and IDs when writing your assertions.

### Logical Folder Structure

* **`/` (Root)**
  * 📁 **`Documents/`** (Folder ID: 1)
    * 📄 `resume_01.docx` (File ID: 1)
    * 📄 `resume_02.docx` (File ID: 2)
    * 📁 **`Work/`** (Folder ID: 3)
      * 📄 `report.docx` (File ID: 3)
      * 📄 `resume.pdf` (File ID: 4)
  * 📁 **`Notes/`** (Folder ID: 2)
    * 📄 `wishlist.txt` (File ID: 5)

---

### Database Records

**Folders Table**
* **ID: 1** | Name: `Documents` | Parent: `NULL`
* **ID: 2** | Name: `Notes` | Parent: `NULL`
* **ID: 3** | Name: `Work` | Parent: `1`

**Files Table**
* **ID: 1** | Name: `resume_01.pdf` | Folder: `1`
* **ID: 2** | Name: `resume_02.pdf` | Folder: `1`
* **ID: 3** | Name: `report.docx` | Folder: `3`
* **ID: 4** | Name: `resume.pdf` | Folder: `3`
* **ID: 5** | Name: `wishlist.txt` | Folder: `2`
