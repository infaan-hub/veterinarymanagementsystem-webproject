import React, { useEffect, useRef, useState } from "react";
import API from "../api";

export default function Patients() {
  const fileRef = useRef(null);
  const latestPhotoTokenRef = useRef(0);
  const [patients, setPatients] = useState([]);
  const [currentClient, setCurrentClient] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [loadingClient, setLoadingClient] = useState(true);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoCache, setPhotoCache] = useState(() => readPhotoCache());
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    color: "",
    date_of_birth: "",
    weight_kg: "",
    client: "",
    photo: null,
  });

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    const client = await loadCurrentClient();
    await loadPatients(client);
  }

  function toList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async function loadPatients(clientOverride = null) {
    try {
      const activeClient = clientOverride || currentClient;
      const activeClientId = String(
        activeClient?.id ??
        activeClient?.client_id ??
        localStorage.getItem("client_id") ??
        ""
      );

      const res = await API.get("/patients/");
      let list = toList(res.data);

      if (activeClientId) {
        list = list.filter(
          (p) => String(p?.client?.id ?? p?.client_id ?? p?.client ?? "") === activeClientId
        );
      }

      setPatients(list);
      list.forEach((p) => {
        if (p?.photo_data && String(p.photo_data).startsWith("data:image/")) {
          const keys = [p.id, p.patient_id].filter(Boolean);
          cachePhotoForKeys(keys, p.photo_data);
        }
      });
    } catch (err) {
      console.error(err);
      setStatus("Could not load patients");
    }
  }

  async function loadCurrentClient() {
    setLoadingClient(true);
    const storedClientId = String(localStorage.getItem("client_id") || "");
    const username = String(localStorage.getItem("username") || "").toLowerCase();
    const email = String(localStorage.getItem("email") || "").toLowerCase();

    try {
      const res = await API.get("/clients/");
      const list = toList(res.data);
      if (!list.length) {
        setCurrentClient(null);
        setStatus("Could not load logged customer");
        return null;
      }

      const matched =
        list.find((c) => String(c?.id ?? c?.client_id ?? "") === storedClientId) ||
        list.find((c) => String(c?.username || "").toLowerCase() === username) ||
        list.find((c) => String(c?.email || "").toLowerCase() === email) ||
        list[0];

      setCurrentClient(matched);
      const clientId = String(matched?.id ?? matched?.client_id ?? "");
      if (clientId) localStorage.setItem("client_id", clientId);

      setForm((s) => ({
        ...s,
        client: clientId,
      }));
      return matched;
    } catch (_err) {
      setCurrentClient(null);
      setStatus("Could not load logged customer");
      return null;
    } finally {
      setLoadingClient(false);
    }
  }

  const svgPlaceholder = (() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='160'>
      <rect width='100%' height='100%' fill='#eeeeee'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-family='Segoe UI, Arial' font-size='18'>No Photo</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  })();

  function readPhotoCache() {
    try {
      const raw = localStorage.getItem("patientPhotoCache");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function writePhotoCache(next) {
    setPhotoCache(next);
    try {
      localStorage.setItem("patientPhotoCache", JSON.stringify(next));
    } catch (_err) {}
  }

  function cachePhotoForKeys(keys, dataUrl) {
    if (!dataUrl) return;
    const next = { ...photoCache };
    keys.filter(Boolean).forEach((k) => {
      next[String(k)] = dataUrl;
    });
    writePhotoCache(next);
  }

  function getCachedPhotoForPatient(patient) {
    const keys = [
      patient?.id,
      patient?.patient_id,
      patient?.patientId,
    ].filter(Boolean);
    for (const k of keys) {
      const hit = photoCache[String(k)];
      if (hit) return hit;
    }
    return "";
  }

  function getPhotoForPatient(patient) {
    if (patient?.photo_data && String(patient.photo_data).startsWith("data:image/")) {
      return patient.photo_data;
    }
    return getCachedPhotoForPatient(patient);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function buildPhotoDataUrl(file) {
    const raw = await fileToDataUrl(file);
    if (!raw) return "";
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 480;
          const maxH = 640;
          const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
          const targetW = Math.round(img.naturalWidth * ratio);
          const targetH = Math.round(img.naturalHeight * ratio);
          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch (_err) {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = raw;
    });
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files?.[0] || null;
      if (file && !file.type.startsWith("image/")) {
        setStatus("Only image files are allowed.");
        if (fileRef.current) fileRef.current.value = "";
        setForm((s) => ({ ...s, photo: null }));
        return;
      }
      setStatus("");
      setForm((s) => ({ ...s, photo: file }));
      setPhotoPreviewUrl("");
      setPhotoDataUrl("");
      if (file) {
        const token = ++latestPhotoTokenRef.current;
        buildPhotoDataUrl(file).then((dataUrl) => {
          if (token !== latestPhotoTokenRef.current) return;
          if (!dataUrl) {
            setStatus("Failed to read image. Try a smaller file.");
            return;
          }
          setPhotoDataUrl(dataUrl);
          setPhotoPreviewUrl(dataUrl);
        });
      }
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({
      name: "",
      species: "",
      breed: "",
      gender: "",
      color: "",
      date_of_birth: "",
      weight_kg: "",
      client: String(currentClient?.id ?? currentClient?.client_id ?? ""),
      photo: null,
    });
    setPhotoPreviewUrl("");
    setPhotoDataUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      species: p.species || "",
      breed: p.breed || "",
      gender: p.gender || "",
      color: p.color || "",
      date_of_birth: p.date_of_birth || "",
      weight_kg: p.weight_kg || "",
      client: String(p.client?.id ?? p.client ?? ""),
      photo: null,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this patient?")) return;
    try {
      await API.delete(`/patients/${id}/`);
      if (editingId === id) clearForm();
      setStatus("Patient deleted");
      await loadPatients();
    } catch (err) {
      console.error(err);
      setStatus("Failed to delete patient");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const activeClientId = String(
      currentClient?.id ??
      currentClient?.client_id ??
      localStorage.getItem("client_id") ??
      ""
    );
    if (!form.name || !form.species || !form.gender || !activeClientId) {
      setStatus("Name, species, gender and logged customer are required. Please login again.");
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      if (k === "photo" || k === "client") return;
      fd.append(k, v);
    });
    fd.append("client", activeClientId);
    if (photoDataUrl) {
      fd.append("photo_data", photoDataUrl);
    }
    try {
      let response;
      if (editingId) {
        response = await API.patch(`/patients/${editingId}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        setStatus("Patient updated");
      } else {
        response = await API.post("/patients/", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setStatus("Patient added");
      }
      if (photoDataUrl) {
        const saved = response?.data || {};
        const keys = [
          editingId,
          saved?.id,
          saved?.patient_id,
        ].filter(Boolean);
        cachePhotoForKeys(keys, photoDataUrl);
      }
      clearForm();
      await loadPatients();
    } catch (err) {
      console.error(err);
      const apiDetail =
        err?.response?.data?.detail ||
        err?.response?.data?.gender?.[0] ||
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.species?.[0] ||
        err?.response?.data?.client?.[0];
      setStatus(apiDetail || "Failed to save patient");
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-shell">
      <aside className="crud-sidebar">
        <h2>Veterinary Management System Customer Panel</h2>
        <nav className="crud-nav">
          <a href="/customer-dashboard">Dashboard</a>
          <a className="active" href="/patients">Patients</a>
          <a href="/appointments">Appointments</a>
          <a href="/overview">Overview</a>
        </nav>
      </aside>
      <main className="crud-main">
      <div className="crud-content">
      <h1>Patients</h1>
      <p className="page-desc">Complete patient profiles, photos, and care details in one place.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="patient-name">Name</label>
        <input
          id="patient-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          autoComplete="off"
          required
        />
        <label htmlFor="patient-species">Species</label>
        <input
          id="patient-species"
          name="species"
          value={form.species}
          onChange={handleChange}
          placeholder="Species"
          autoComplete="off"
          required
        />
        <label htmlFor="patient-breed">Breed</label>
        <input
          id="patient-breed"
          name="breed"
          value={form.breed}
          onChange={handleChange}
          placeholder="Breed"
          autoComplete="off"
        />
        <label htmlFor="patient-gender">Gender</label>
        <input
          id="patient-gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          placeholder="Gender"
          autoComplete="off"
          required
        />
        <label htmlFor="patient-color">Color</label>
        <input
          id="patient-color"
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="Color"
          autoComplete="off"
        />
        <label htmlFor="patient-dob">Date of Birth</label>
        <input
          id="patient-dob"
          type="date"
          name="date_of_birth"
          value={form.date_of_birth}
          onChange={handleChange}
          autoComplete="off"
        />
        <label htmlFor="patient-weight">Weight (kg)</label>
        <input
          id="patient-weight"
          type="number"
          step="0.01"
          name="weight_kg"
          value={form.weight_kg}
          onChange={handleChange}
          placeholder="Weight kg"
          autoComplete="off"
        />
        <label htmlFor="customer-display">Customer</label>
        <input
          id="customer-display"
          name="customer_display"
          value={
            currentClient?.full_name ||
            currentClient?.username ||
            localStorage.getItem("username") ||
            currentClient?.email ||
            "Logged customer"
          }
          autoComplete="name"
          readOnly
        />
        <label htmlFor="patient-photo">Patient Photo</label>
        <input
          id="patient-photo"
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/*"
          onChange={handleChange}
          autoComplete="off"
        />
        {photoPreviewUrl ? (
          <img className="patient-photo" src={photoPreviewUrl} alt="Selected patient" />
        ) : null}
        <button type="submit" disabled={loadingClient || !currentClient}>
          {editingId ? "Update Patient" : "Add Patient"}
        </button>
        {editingId ? <button type="button" onClick={clearForm}>Cancel</button> : null}
      </form>
      <p className="status-msg">{status}</p>
      <div className="crud-list">
        {patients.map((p) => (
          <div key={p.id} className="crud-record-card">
            <img
              className="patient-photo"
              src={getPhotoForPatient(p) || svgPlaceholder}
              alt={p.name || "patient"}
            />
            <strong>{p.name}</strong>
            <div>{p.species} {p.breed || ""}</div>
            <button type="button" className="action-btn" onClick={() => startEdit(p)}>Edit</button>
            <button type="button" className="action-btn" onClick={() => handleDelete(p.id)}>Delete</button>
          </div>
        ))}
      </div>
      </div>
      </main>
      </div>
    </div>
  );
}
