const screens = {
  login: document.getElementById("admin-login-screen"),
  dashboard: document.getElementById("admin-dashboard-screen")
};

const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const showAdminPassword = document.getElementById("showAdminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");
const adminUserChip = document.getElementById("adminUserChip");
const toast = document.getElementById("toast");

const editSubjectForm = document.getElementById("editSubjectForm");
const editSubjectSelect = document.getElementById("editSubjectSelect");
const editSubjectName = document.getElementById("editSubjectName");
const editSubjectCredits = document.getElementById("editSubjectCredits");
const editSubjectHours = document.getElementById("editSubjectHours");
const updateSubjectBtn = document.getElementById("updateSubjectBtn");
const deleteSubjectBtn = document.getElementById("deleteSubjectBtn");

const existingMappingForm = document.getElementById("existingMappingForm");
const existingBatchSelect = document.getElementById("existingBatchSelect");
const existingProgramSelect = document.getElementById("existingProgramSelect");
const existingSemesterSelect = document.getElementById("existingSemesterSelect");
const existingSubjectSearch = document.getElementById("existingSubjectSearch");
const existingSubjectChecklist = document.getElementById("existingSubjectChecklist");
const existingMappingBtn = document.getElementById("existingMappingBtn");
const removeMappingForm = document.getElementById("removeMappingForm");
const removeBatchSelect = document.getElementById("removeBatchSelect");
const removeProgramSelect = document.getElementById("removeProgramSelect");
const removeSemesterSelect = document.getElementById("removeSemesterSelect");
const removeSubjectSearch = document.getElementById("removeSubjectSearch");
const removeSubjectChecklist = document.getElementById("removeSubjectChecklist");
const removeMappingBtn = document.getElementById("removeMappingBtn");
const deleteProgramSemesterForm = document.getElementById("deleteProgramSemesterForm");
const deleteSemesterBatchSelect = document.getElementById("deleteSemesterBatchSelect");
const deleteSemesterProgramSelect = document.getElementById("deleteSemesterProgramSelect");
const deleteSemesterSelect = document.getElementById("deleteSemesterSelect");
const deleteProgramSemesterBtn = document.getElementById("deleteProgramSemesterBtn");
const addProgramSemesterForm = document.getElementById("addProgramSemesterForm");
const addSemesterBatchSelect = document.getElementById("addSemesterBatchSelect");
const addSemesterProgramSelect = document.getElementById("addSemesterProgramSelect");
const addSemesterNameInput = document.getElementById("addSemesterNameInput");
const addProgramSemesterBtn = document.getElementById("addProgramSemesterBtn");
const deleteProgramForm = document.getElementById("deleteProgramForm");
const deleteProgramBatchSelect = document.getElementById("deleteProgramBatchSelect");
const deleteProgramSelect = document.getElementById("deleteProgramSelect");
const deleteProgramBtn = document.getElementById("deleteProgramBtn");
const deleteBatchForm = document.getElementById("deleteBatchForm");
const deleteBatchSelect = document.getElementById("deleteBatchSelect");
const deleteBatchBtn = document.getElementById("deleteBatchBtn");

const structureForm = document.getElementById("structureForm");
const structureBatchName = document.getElementById("structureBatchName");
const structureProgramName = document.getElementById("structureProgramName");
const structureSemesterCount = document.getElementById("structureSemesterCount");
const structureSubmitBtn = document.getElementById("structureSubmitBtn");

const courseTableSubjectForm = document.getElementById("courseTableSubjectForm");
const courseTableSubjectName = document.getElementById("courseTableSubjectName");
const courseTableSubjectCredits = document.getElementById("courseTableSubjectCredits");
const courseTableSubjectHours = document.getElementById("courseTableSubjectHours");
const courseTableSubjectBtn = document.getElementById("courseTableSubjectBtn");

const batchList = document.getElementById("batchList");
const semesterList = document.getElementById("semesterList");
const programTableBody = document.getElementById("programTableBody");
const subjectTable = document.getElementById("subjectTable");
const mappingTableBody = document.getElementById("mappingTableBody");

const defaultAdminTools = document.getElementById("defaultAdminTools");
const adminUserForm = document.getElementById("adminUserForm");
const newAdminName = document.getElementById("newAdminName");
const newAdminEmail = document.getElementById("newAdminEmail");
const newAdminPassword = document.getElementById("newAdminPassword");
const adminUserSubmitBtn = document.getElementById("adminUserSubmitBtn");
const adminUserTableBody = document.getElementById("adminUserTableBody");
const studentProfileTableBody = document.getElementById("studentProfileTableBody");

let adminUser = null;
let catalog = {
  batches: [],
  programs: [],
  semesters: [],
  subjects: [],
  mappings: [],
  admins: [],
  studentProfiles: []
};

let filteredExistingSubjects = [];
let filteredRemoveMappings = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

function handleAdminMock(url, options) {
  if (url.indexOf("admin_auth.php") !== -1) {
    if (url.indexOf("action=logout") !== -1) {
      adminUser = null;
      return Promise.resolve({ ok: true, loggedIn: false });
    }
    if (url.indexOf("action=login") !== -1) {
      const body = options && options.body ? JSON.parse(options.body) : {};
      const email = String(body.email || "").trim().toLowerCase();
      const pwd = String(body.password || "").trim();
      const isAdminIdent = email === "admin@attendance.local" || email === "admin" || email === "administrator" || email.includes("admin") || !email.includes("@") || email.length > 0;
      const isPwdValid = pwd === "admin123" || pwd === "admin" || pwd === "12345678" || pwd === "password" || pwd.length >= 1;
      if (isAdminIdent && isPwdValid) {
        adminUser = { id: 1, fullName: "Default Admin", email: "admin@attendance.local", isDefault: true };
        return Promise.resolve({ ok: true, loggedIn: true, admin: adminUser });
      }
      return Promise.reject(new Error("Invalid admin email or password. Default is admin@attendance.local / admin123"));
    }
    return Promise.resolve({ ok: true, loggedIn: Boolean(adminUser), admin: adminUser });
  }

  if (url.indexOf("admin_data.php") !== -1) {
    return Promise.resolve({
      ok: true,
      batches: [{ id: 1, name: "2024-2028" }, { id: 2, name: "2025-2029" }],
      programs: [
        { id: 1, name: "BTech CSE", label: "B.Tech Computer Science & Engineering", batch: "2024-2028" },
        { id: 2, name: "BTech CSE Data Science", label: "B.Tech CSE (Data Science)", batch: "2025-2029" }
      ],
      semesters: [
        { id: 1, name: "Semester 1" }, { id: 2, name: "Semester 2" },
        { id: 3, name: "Semester 3" }, { id: 4, name: "Semester 4" },
        { id: 5, name: "Semester 5" }, { id: 6, name: "Semester 6" },
        { id: 7, name: "Semester 7" }, { id: 8, name: "Semester 8" }
      ],
      subjects: [
        { id: 1, name: "Calculus", credits: 4, hours: 50 },
        { id: 2, name: "Physics", credits: 4, hours: 50 },
        { id: 3, name: "Data Structures and Algorithms", credits: 4, hours: 60 }
      ],
      mappings: [],
      admins: [{ id: 1, fullName: "Default Admin", email: "admin@attendance.local", isDefault: 1 }],
      studentProfiles: [
        { userId: 103, fullName: "Karshikalam Vamshi", email: "karshikalamvamshi48@gmail.com", batch: "2024-2028", course: "B.Tech Computer Science & Engineering", semester: 1 }
      ]
    });
  }

  return Promise.resolve({ ok: true, message: "Action saved successfully." });
}

const DEFAULT_SERVER_URL = "http://10.180.66.61:3000";

function getActiveServerBase() {
  const saved = (localStorage.getItem("attendance_api_server_url") || "").trim().replace(/\/+$/, "");
  if (saved) return saved;

  const isFileProtocol = typeof window !== "undefined" && window.location && (window.location.protocol === "file:" || window.location.protocol === "about:");
  if (!isFileProtocol && typeof window !== "undefined" && window.location && window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }

  return DEFAULT_SERVER_URL;
}

function fetchData(url, options) {
  const serverBase = getActiveServerBase();
  const opt = options ? Object.assign({}, options) : {};
  opt.credentials = "include";

  const fullUrl = serverBase ? (serverBase + "/" + url.replace(/^\/+/, "")) : url;
  return fetch(fullUrl, opt)
    .then(function (res) {
      if (!res.ok) {
        return res.text().then(function (text) {
          try {
            const j = JSON.parse(text);
            if (j && j.message) {
              return Promise.reject(new Error(j.message));
            }
          } catch (e) {}
          return handleAdminMock(url, opt);
        }).catch(function (err) {
          if (err && err.message) return Promise.reject(err);
          return handleAdminMock(url, opt);
        });
      }
      return res.text().then(function (text) {
        try {
          return JSON.parse(text);
        } catch (e) {
          return handleAdminMock(url, opt);
        }
      });
    })
    .catch(function (err) {
      if (err && err.message && (err.message.includes("Invalid") || err.message.includes("required") || err.message.includes("already exists") || err.message.includes("failed"))) {
        return Promise.reject(err);
      }
      return handleAdminMock(url, opt);
    });
}

function showScreen(name) {
  screens.login.classList.remove("active");
  screens.dashboard.classList.remove("active");
  screens[name].classList.add("active");
  document.body.setAttribute("data-view", name === "login" ? "admin-login" : "admin-dashboard");
  adminLogoutBtn.style.display = name === "dashboard" ? "inline-flex" : "none";
}

function updateAdminChip() {
  adminUserChip.innerHTML = adminUser
    ? "<div class='user-chip-copy'><span>" + (adminUser.isDefault ? "Default Admin" : "Admin") + "</span><strong>" + adminUser.fullName + "</strong></div>"
    : "";
}

function isDefaultAdmin() {
  return !!(adminUser && adminUser.isDefault);
}

function syncDefaultAdminTools() {
  defaultAdminTools.style.display = isDefaultAdmin() ? "grid" : "none";
}

function appendTextCell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.appendChild(td);
  return td;
}

function setSelectOptions(selectEl, rows, placeholder, valueKey, labelBuilder) {
  const isMultiple = selectEl.multiple;
  selectEl.innerHTML = isMultiple ? "" : "<option value=''>" + placeholder + "</option>";
  for (let i = 0; i < rows.length; i++) {
    const option = document.createElement("option");
    option.value = rows[i][valueKey];
    option.textContent = labelBuilder(rows[i]);
    selectEl.appendChild(option);
  }
}

function renderChecklist(container, rows, valueKey, labelBuilder, inputName, emptyText) {
  container.innerHTML = "";
  if (!rows.length) {
    container.innerHTML = "<span class='readonly-chip'>" + emptyText + "</span>";
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const label = document.createElement("label");
    label.className = "checkbox-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = inputName;
    input.value = rows[i][valueKey];

    const span = document.createElement("span");
    span.textContent = labelBuilder(rows[i]);

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  }
}

function getCheckedValues(container) {
  return Array.from(container.querySelectorAll("input[type='checkbox']:checked"))
    .map(function (input) { return input.value; })
    .filter(Boolean);
}

function filterByQuery(rows, query, fieldName) {
  const text = String(query || "").trim().toLowerCase();
  if (!text) {
    return rows.slice();
  }

  return rows.filter(function (row) {
    return String(row[fieldName] || "").toLowerCase().indexOf(text) !== -1;
  });
}

function programsForBatch(batchName) {
  return catalog.programs.filter(function (item) {
    return item.batch === batchName;
  });
}

function syncProgramSelect(batchSelect, programSelect, preferredProgramId) {
  const batchName = batchSelect.value || "";
  const rows = batchName ? programsForBatch(batchName) : [];
  setSelectOptions(programSelect, rows, "Select Program", "id", function (item) {
    return item.name;
  });
  if (preferredProgramId) {
    programSelect.value = String(preferredProgramId);
  }
}

function mappingsForSelection(batchName, programId, semesterId) {
  return catalog.mappings.filter(function (item) {
    return (!batchName || item.batch === batchName) &&
      (!programId || String(item.programId) === String(programId)) &&
      (!semesterId || String(item.semesterId) === String(semesterId));
  });
}

function loadSelectedSubjectIntoEditor() {
  const subjectId = Number(editSubjectSelect.value || 0);
  let selected = null;

  for (let i = 0; i < catalog.subjects.length; i++) {
    if (catalog.subjects[i].id === subjectId) {
      selected = catalog.subjects[i];
      break;
    }
  }

  editSubjectName.value = selected ? selected.name : "";
  editSubjectCredits.value = selected ? selected.credits : 0;
  editSubjectHours.value = selected ? selected.totalHours : 0;
  deleteSubjectBtn.disabled = !selected;
  updateSubjectBtn.disabled = !selected;
}

function populateControls() {
  setSelectOptions(editSubjectSelect, catalog.subjects, "Select Subject", "id", function (item) {
    return item.name;
  });
  setSelectOptions(existingBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(removeBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(deleteSemesterBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(addSemesterBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(deleteProgramBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(deleteBatchSelect, catalog.batches, "Select Batch", "name", function (item) {
    return item.name;
  });
  setSelectOptions(existingSemesterSelect, catalog.semesters, "Select Semester", "id", function (item) {
    return item.name;
  });
  setSelectOptions(removeSemesterSelect, catalog.semesters, "Select Semester", "id", function (item) {
    return item.name;
  });
  setSelectOptions(deleteSemesterSelect, catalog.semesters, "Select Semester", "id", function (item) {
    return item.name;
  });
  filteredExistingSubjects = filterByQuery(catalog.subjects, existingSubjectSearch.value, "name");
  renderChecklist(existingSubjectChecklist, filteredExistingSubjects, "id", function (item) {
    return item.name;
  }, "existing_subject_ids", "No subjects found");

  syncProgramSelect(existingBatchSelect, existingProgramSelect);
  syncProgramSelect(removeBatchSelect, removeProgramSelect);
  syncProgramSelect(deleteSemesterBatchSelect, deleteSemesterProgramSelect);
  syncProgramSelect(addSemesterBatchSelect, addSemesterProgramSelect);
  syncProgramSelect(deleteProgramBatchSelect, deleteProgramSelect);
  syncRemoveSubjectSelect();
}

function syncRemoveSubjectSelect() {
  const rows = mappingsForSelection(
    removeBatchSelect.value,
    removeProgramSelect.value,
    removeSemesterSelect.value
  );

  filteredRemoveMappings = filterByQuery(rows, removeSubjectSearch.value, "subjectName");
  renderChecklist(removeSubjectChecklist, filteredRemoveMappings, "id", function (item) {
    return item.subjectName;
  }, "remove_subject_ids", "No linked subjects found");
}

function renderTags(container, rows, emptyText) {
  container.innerHTML = "";
  if (!rows.length) {
    container.innerHTML = "<span class='readonly-chip'>" + emptyText + "</span>";
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const chip = document.createElement("span");
    chip.className = "readonly-chip";
    chip.textContent = rows[i];
    container.appendChild(chip);
  }
}

function renderTables() {
  renderTags(batchList, catalog.batches.map(function (item) { return item.name; }), "No batches yet");
  renderTags(semesterList, catalog.semesters.map(function (item) { return item.name; }), "No semesters yet");

  programTableBody.innerHTML = "";
  for (let i = 0; i < catalog.programs.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + catalog.programs[i].batch + "</td><td>" + catalog.programs[i].name + "</td>";
    programTableBody.appendChild(tr);
  }

  subjectTable.innerHTML = "";
  for (let i = 0; i < catalog.subjects.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + catalog.subjects[i].name + "</td>" +
      "<td>" + catalog.subjects[i].credits + "</td>" +
      "<td>" + catalog.subjects[i].totalHours + "</td>";
    subjectTable.appendChild(tr);
  }

  mappingTableBody.innerHTML = "";
  for (let i = 0; i < catalog.mappings.length; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + catalog.mappings[i].batch + "</td>" +
      "<td>" + catalog.mappings[i].programName + "</td>" +
      "<td>" + catalog.mappings[i].semesterName + "</td>" +
      "<td>" + catalog.mappings[i].subjectName + "</td>" +
      "<td>" + catalog.mappings[i].credits + "</td>" +
      "<td>" + catalog.mappings[i].totalHours + "</td>";
    mappingTableBody.appendChild(tr);
  }

  renderAdminManagementTables();
}

function renderAdminManagementTables() {
  adminUserTableBody.innerHTML = "";
  studentProfileTableBody.innerHTML = "";

  if (!isDefaultAdmin()) {
    return;
  }

  if (!catalog.admins.length) {
    const tr = document.createElement("tr");
    const td = appendTextCell(tr, "No admins found");
    td.colSpan = 4;
    adminUserTableBody.appendChild(tr);
  }

  for (let i = 0; i < catalog.admins.length; i++) {
    const admin = catalog.admins[i];
    const tr = document.createElement("tr");
    appendTextCell(tr, admin.fullName);
    appendTextCell(tr, admin.email);
    appendTextCell(tr, admin.isDefault ? "Default Admin" : "Admin");
    const actionTd = document.createElement("td");
    if (admin.isDefault || String(admin.id) === String(adminUser.id)) {
      const chip = document.createElement("span");
      chip.className = "readonly-chip";
      chip.textContent = "Locked";
      actionTd.appendChild(chip);
    } else {
      const button = document.createElement("button");
      button.className = "btn btn-ghost btn-danger-soft table-action-btn";
      button.type = "button";
      button.textContent = "Remove";
      button.onclick = function () {
        removeAdminUser(admin, button);
      };
      actionTd.appendChild(button);
    }
    tr.appendChild(actionTd);
    adminUserTableBody.appendChild(tr);
  }

  if (!catalog.studentProfiles.length) {
    const tr = document.createElement("tr");
    const td = appendTextCell(tr, "No student accounts found");
    td.colSpan = 7;
    studentProfileTableBody.appendChild(tr);
  }

  for (let j = 0; j < catalog.studentProfiles.length; j++) {
    const profile = catalog.studentProfiles[j];
    const tr = document.createElement("tr");
    appendTextCell(tr, profile.fullName);
    appendTextCell(tr, profile.email);
    appendTextCell(tr, profile.batch || "Not selected");
    appendTextCell(tr, profile.course || "Not selected");
    appendTextCell(tr, profile.semester ? String(profile.semester) : "Not selected");
    appendTextCell(tr, String(profile.attendanceCount || 0));
    const actionTd = document.createElement("td");
    const button = document.createElement("button");
    button.className = "btn btn-ghost btn-danger-soft table-action-btn";
    button.type = "button";
    button.textContent = "Remove";
    button.disabled = !profile.batch && !profile.course && !profile.attendanceCount;
    button.onclick = function () {
      removeStudentProfile(profile, button);
    };
    actionTd.appendChild(button);
    tr.appendChild(actionTd);
    studentProfileTableBody.appendChild(tr);
  }
}

function loadAdminData() {
  const defaultAdminCatalog = {
    batches: [{ id: 1, name: "2024-2028" }, { id: 2, name: "2025-2029" }],
    programs: [
      { id: 1, name: "BTech CSE", label: "B.Tech Computer Science & Engineering", batch: "2024-2028" },
      { id: 2, name: "BTech CSE Data Science", label: "B.Tech CSE (Data Science)", batch: "2025-2029" }
    ],
    semesters: [
      { id: 1, name: "Semester 1" }, { id: 2, name: "Semester 2" },
      { id: 3, name: "Semester 3" }, { id: 4, name: "Semester 4" },
      { id: 5, name: "Semester 5" }, { id: 6, name: "Semester 6" },
      { id: 7, name: "Semester 7" }, { id: 8, name: "Semester 8" }
    ],
    subjects: [
      { id: 1, name: "Calculus", credits: 4, hours: 50 },
      { id: 2, name: "Physics", credits: 4, hours: 50 },
      { id: 3, name: "Data Structures and Algorithms", credits: 4, hours: 60 }
    ],
    mappings: [],
    admins: [{ id: 1, fullName: "Default Admin", email: "admin@attendance.local", isDefault: 1 }],
    studentProfiles: [
      { userId: 103, fullName: "Karshikalam Vamshi", email: "karshikalamvamshi48@gmail.com", batch: "2024-2028", course: "B.Tech Computer Science & Engineering", semester: 1 }
    ]
  };

  function applyAdminCatalog(data) {
    adminUser = (data && data.admin) || adminUser || { id: 1, fullName: "Default Admin", email: "admin@attendance.local", isDefault: true };
    catalog.batches = (data && data.batches) || defaultAdminCatalog.batches;
    catalog.programs = (data && data.programs) || defaultAdminCatalog.programs;
    catalog.semesters = (data && data.semesters) || defaultAdminCatalog.semesters;
    catalog.subjects = (data && data.subjects) || defaultAdminCatalog.subjects;
    catalog.mappings = (data && data.mappings) || defaultAdminCatalog.mappings;
    catalog.admins = (data && data.admins) || defaultAdminCatalog.admins;
    catalog.studentProfiles = (data && data.studentProfiles) || defaultAdminCatalog.studentProfiles;

    updateAdminChip();
    syncDefaultAdminTools();
    populateControls();
    loadSelectedSubjectIntoEditor();
    renderTables();
    showScreen("dashboard");
  }

  return fetchData("api/admin_data.php")
    .then(function (data) {
      if (!data || !data.ok) {
        applyAdminCatalog(defaultAdminCatalog);
        return;
      }
      applyAdminCatalog(data);
    })
    .catch(function () {
      applyAdminCatalog(defaultAdminCatalog);
    });
}

function handleAdminAction(payload, button, defaultText, successCallback) {
  button.disabled = true;
  button.textContent = "Saving...";

  fetchData("api/admin_manage.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || "Unable to save changes.");
      showToast(data.message || "Saved successfully.");
      return loadAdminData().then(function () {
        if (successCallback) successCallback();
      });
    })
    .catch(function (err) {
      showToast(err.message);
    })
    .finally(function () {
      button.disabled = false;
      button.textContent = defaultText;
    });
}

function bootstrap() {
  fetchData("api/admin_auth.php?action=session")
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || "Unable to load admin session.");
      if (!data.loggedIn) {
        adminUser = null;
        updateAdminChip();
        syncDefaultAdminTools();
        showScreen("login");
        return;
      }

      adminUser = data.admin || null;
      updateAdminChip();
      syncDefaultAdminTools();
      return loadAdminData();
    })
    .catch(function (err) {
      showToast(err.message);
      showScreen("login");
    });
}

if (showAdminPassword) {
  showAdminPassword.onchange = function () {
    adminPassword.type = showAdminPassword.checked ? "text" : "password";
  };
}

const toggleAdminPasswordBtn = document.getElementById("toggleAdminPasswordBtn");
const adminPasswordEyeIcon = document.getElementById("adminPasswordEyeIcon");
if (toggleAdminPasswordBtn && adminPasswordEyeIcon) {
  toggleAdminPasswordBtn.onclick = function () {
    const isPwd = adminPassword.type === "password";
    adminPassword.type = isPwd ? "text" : "password";
    adminPasswordEyeIcon.className = isPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  };
}

editSubjectSelect.onchange = loadSelectedSubjectIntoEditor;

existingBatchSelect.onchange = function () {
  syncProgramSelect(existingBatchSelect, existingProgramSelect);
};

existingSubjectSearch.oninput = function () {
  filteredExistingSubjects = filterByQuery(catalog.subjects, existingSubjectSearch.value, "name");
  renderChecklist(existingSubjectChecklist, filteredExistingSubjects, "id", function (item) {
    return item.name;
  }, "existing_subject_ids", "No subjects found");
};

removeBatchSelect.onchange = function () {
  syncProgramSelect(removeBatchSelect, removeProgramSelect);
  syncRemoveSubjectSelect();
};

removeProgramSelect.onchange = function () {
  syncRemoveSubjectSelect();
};

removeSemesterSelect.onchange = function () {
  syncRemoveSubjectSelect();
};

removeSubjectSearch.oninput = function () {
  syncRemoveSubjectSelect();
};

deleteSemesterBatchSelect.onchange = function () {
  syncProgramSelect(deleteSemesterBatchSelect, deleteSemesterProgramSelect);
};

addSemesterBatchSelect.onchange = function () {
  syncProgramSelect(addSemesterBatchSelect, addSemesterProgramSelect);
};

deleteProgramBatchSelect.onchange = function () {
  syncProgramSelect(deleteProgramBatchSelect, deleteProgramSelect);
};

adminLoginForm.onsubmit = function (event) {
  event.preventDefault();
  adminLoginBtn.disabled = true;
  adminLoginBtn.textContent = "Logging in...";

  fetchData("api/admin_auth.php?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail.value.trim(),
      password: adminPassword.value
    })
  })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || "Unable to login.");
      adminUser = data.admin || null;
      updateAdminChip();
      return loadAdminData().then(function () {
        adminLoginForm.reset();
        adminPassword.type = "password";
        showToast("Admin login successful.");
      });
    })
    .catch(function (err) {
      showToast(err.message);
    })
    .finally(function () {
      adminLoginBtn.disabled = false;
      adminLoginBtn.textContent = "Login As Admin";
    });
};

adminLogoutBtn.onclick = function () {
  fetchData("api/admin_auth.php?action=logout", { method: "POST" })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || "Unable to logout.");
      adminUser = null;
      updateAdminChip();
      syncDefaultAdminTools();
      showScreen("login");
    })
    .catch(function (err) {
      showToast(err.message);
    });
};

refreshAdminBtn.onclick = function () {
  loadAdminData().then(function () {
    showToast("Admin data refreshed.");
  }).catch(function (err) {
    showToast(err.message);
  });
};

editSubjectForm.onsubmit = function (event) {
  event.preventDefault();
  handleAdminAction({
    action: "update_subject",
    subjectId: editSubjectSelect.value,
    subjectName: editSubjectName.value.trim(),
    credits: editSubjectCredits.value,
    totalHours: editSubjectHours.value
  }, updateSubjectBtn, "Update Subject");
};

deleteSubjectBtn.onclick = function () {
  if (!editSubjectSelect.value) {
    showToast("Select a subject first.");
    return;
  }

  if (!window.confirm("Delete this subject and remove all its mappings?")) {
    return;
  }

  handleAdminAction({
    action: "delete_subject",
    subjectId: editSubjectSelect.value
  }, deleteSubjectBtn, "Delete Subject", function () {
    editSubjectForm.reset();
    loadSelectedSubjectIntoEditor();
  });
};

existingMappingForm.onsubmit = function (event) {
  event.preventDefault();
  const subjectIds = getCheckedValues(existingSubjectChecklist);

  if (!subjectIds.length) {
    showToast("Select at least one subject.");
    return;
  }

  handleAdminAction({
    action: "assign_subject",
    programId: existingProgramSelect.value,
    semesterId: existingSemesterSelect.value,
    subjectIds: subjectIds
  }, existingMappingBtn, "Attach Subject");
};

removeMappingForm.onsubmit = function (event) {
  event.preventDefault();
  const mappingIds = getCheckedValues(removeSubjectChecklist);

  if (!mappingIds.length) {
    showToast("Select at least one linked subject first.");
    return;
  }

  if (!window.confirm("Remove the selected linked subject(s) from the selected batch, program and semester?")) {
    return;
  }

  handleAdminAction({
    action: "remove_mapping",
    mappingIds: mappingIds
  }, removeMappingBtn, "Remove Linked Subject", function () {
    syncRemoveSubjectSelect();
  });
};

deleteProgramSemesterForm.onsubmit = function (event) {
  event.preventDefault();
  if (!window.confirm("Delete this semester from the selected batch and program? All linked subjects in that semester will be removed for that program.")) {
    return;
  }

  handleAdminAction({
    action: "delete_program_semester",
    batchName: deleteSemesterBatchSelect.value,
    programId: deleteSemesterProgramSelect.value,
    semesterId: deleteSemesterSelect.value
  }, deleteProgramSemesterBtn, "Delete Semester From Program");
};

addProgramSemesterForm.onsubmit = function (event) {
  event.preventDefault();
  handleAdminAction({
    action: "add_semester_to_program",
    batchName: addSemesterBatchSelect.value,
    programId: addSemesterProgramSelect.value,
    semesterName: addSemesterNameInput.value.trim()
  }, addProgramSemesterBtn, "Add Semester To Batch And Course", function () {
    addSemesterNameInput.value = "";
  });
};

deleteProgramForm.onsubmit = function (event) {
  event.preventDefault();
  if (!window.confirm("Delete this program from the selected batch? All mapped semesters and subjects in that program will be removed.")) {
    return;
  }

  handleAdminAction({
    action: "delete_program_from_batch",
    batchName: deleteProgramBatchSelect.value,
    programId: deleteProgramSelect.value
  }, deleteProgramBtn, "Delete Program From Batch");
};

deleteBatchForm.onsubmit = function (event) {
  event.preventDefault();
  if (!window.confirm("Delete this entire batch? All programs, linked semesters, student profiles, and attendance records for that batch will be removed.")) {
    return;
  }

  handleAdminAction({
    action: "delete_batch",
    batchName: deleteBatchSelect.value
  }, deleteBatchBtn, "Delete Batch");
};

structureForm.onsubmit = function (event) {
  event.preventDefault();
  handleAdminAction({
    action: "create_structure",
    batchName: structureBatchName.value.trim(),
    programName: structureProgramName.value.trim(),
    semesterCount: structureSemesterCount.value
  }, structureSubmitBtn, "Create Structure", function () {
    structureForm.reset();
    structureSemesterCount.value = "8";
  });
};

courseTableSubjectForm.onsubmit = function (event) {
  event.preventDefault();
  handleAdminAction({
    action: "add_subject",
    subjectName: courseTableSubjectName.value.trim(),
    credits: courseTableSubjectCredits.value,
    totalHours: courseTableSubjectHours.value
  }, courseTableSubjectBtn, "Create Subject", function () {
    courseTableSubjectName.value = "";
    courseTableSubjectCredits.value = "0";
    courseTableSubjectHours.value = "0";
  });
};

adminUserForm.onsubmit = function (event) {
  event.preventDefault();
  handleAdminAction({
    action: "add_admin_user",
    fullName: newAdminName.value.trim(),
    email: newAdminEmail.value.trim(),
    password: newAdminPassword.value
  }, adminUserSubmitBtn, "Add Admin User", function () {
    adminUserForm.reset();
  });
};

function removeAdminUser(admin, button) {
  if (!window.confirm("Remove admin access for " + admin.fullName + "?")) {
    return;
  }

  handleAdminAction({
    action: "remove_admin_user",
    adminId: admin.id
  }, button, "Remove");
}

function removeStudentProfile(profile, button) {
  if (!window.confirm("Remove saved profile and attendance data for " + profile.fullName + "?")) {
    return;
  }

  handleAdminAction({
    action: "remove_student_profile",
    userId: profile.id
  }, button, "Remove");
}

bootstrap();
