import { useState, useEffect, useCallback } from "react";
import {
  FaBuilding, FaPlus, FaMapMarkerAlt, FaUsers, FaMoneyBillWave,
  FaTrashAlt, FaStar, FaRegStar, FaLayerGroup, FaUpload,
  FaChevronDown, FaChevronUp, FaTimes, FaExternalLinkAlt, FaBan,
} from "react-icons/fa";
import { getMyVenues, createVenue, deleteVenue } from "../../api/venues";

const SHAPE_PRESETS = [
  { label: "None",         value: "",                  preview: null },
  { label: "Theatre",      value: "/theatre.png",      preview: "/theatre.png" },
  { label: "U-Shaped",     value: "/U shaped.png",     preview: "/U shaped.png" },
  { label: "Chaired Room", value: "/chaired room.png", preview: "/chaired room.png" },
  { label: "Free Style",   value: "/free Style.png",   preview: "/free Style.png" },
];

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const ImagePicker = ({ label, value, onChange, presets, hint }) => {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(await toBase64(file));
  };
  return (
    <div className="field form-full">
      {label && <label className="image-picker-label-text">{label}</label>}
      <label className="image-picker-upload-label">
        <FaUpload size={13} /> Upload Image
        <input type="file" accept="image/*" className="hidden-input" onChange={handleFile} />
      </label>
      {presets && (
        <div className="image-picker-presets">
          {presets.map(p => (
            <button key={p.value} type="button" onClick={() => onChange(p.value)}
              className={`image-picker-preset-btn${value === p.value ? " selected" : ""}`}>
              {p.preview
                ? <img src={p.preview} alt={p.label} className="image-picker-preset-img" />
                : <div className="image-picker-none-placeholder"><FaBan size={18} color="#6e6c8a" /><span className="image-picker-none-label">None</span></div>}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="image-picker-hint">{hint}</p>}
      {value && (
        <div className="image-picker-preview-wrap">
          <img src={value} alt="Preview" className="image-picker-preview" />
          <button type="button" onClick={() => onChange("")} className="image-picker-clear-btn"><FaTimes size={10} /></button>
        </div>
      )}
    </div>
  );
};

const EMPTY_FORM = { name: "", state: "", city: "", address: "", capacity: "", pricePerDay: "", layoutDescription: "", imageUrl: "", venueShape: "", latitude: "", longitude: "" };

const ProviderDashboard = () => {
  const [view, setView] = useState("list");
  const [venues, setVenues] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchVenues = useCallback(async () => {
    const data = await getMyVenues();
    setVenues(data);
  }, []);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await createVenue(form);
    setForm(EMPTY_FORM);
    setView("list");
    fetchVenues();
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this venue?")) return;
    await deleteVenue(id);
    setVenues(p => p.filter(v => v._id !== id));
  };

  const totalCapacity = venues.reduce((s, v) => s + v.capacity, 0);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{venues.length}</div><div className="stat-label">Total Venues</div></div>
        <div className="stat-card"><div className="stat-value">{venues.filter(v => v.status === "AVAILABLE").length}</div><div className="stat-label">Available</div></div>
        <div className="stat-card"><div className="stat-value">{venues.filter(v => v.status === "BOOKED").length}</div><div className="stat-label">Booked</div></div>
        <div className="stat-card"><div className="stat-value">{totalCapacity.toLocaleString()}</div><div className="stat-label">Total Capacity</div></div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${view === "list" ? "tab-btn-primary" : "tab-btn-secondary"}`} onClick={() => setView("list")}><FaBuilding size={13} /> My Venues</button>
        <button className={`tab-btn ${view === "add" ? "tab-btn-primary" : "tab-btn-secondary"}`} onClick={() => setView("add")}><FaPlus size={13} /> Register Venue</button>
      </div>

      {view === "add" && (
        <div className="panel">
          <div className="panel-title"><FaBuilding size={15} /> Register a New Venue</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Field label="Venue Name *"         name="name"        value={form.name}        onChange={handleChange} placeholder="Grand Palace Hall" required />
              <Field label="State *"              name="state"       value={form.state}       onChange={handleChange} placeholder="Maharashtra" required />
              <Field label="City *"               name="city"        value={form.city}        onChange={handleChange} placeholder="Mumbai" required />
              <Field label="Full Address"         name="address"     value={form.address}     onChange={handleChange} placeholder="123 Main Rd" />
              <Field label="Capacity *"           name="capacity"    value={form.capacity}    onChange={handleChange} type="number" min="1" required placeholder="500" />
              <Field label="Price Per Day (₹) *"  name="pricePerDay" value={form.pricePerDay} onChange={handleChange} type="number" min="0" required placeholder="50000" />
              <Field label="Latitude"             name="latitude"    value={form.latitude}    onChange={handleChange} type="number" step="any" placeholder="19.0760" />
              <Field label="Longitude"            name="longitude"   value={form.longitude}   onChange={handleChange} type="number" step="any" placeholder="72.8777" />
              <div className="field form-full">
                <label>Layout Description</label>
                <textarea name="layoutDescription" value={form.layoutDescription} onChange={handleChange} placeholder="Seating, stage, parking, A/V..." />
              </div>
            </div>
            <ImagePicker label="Venue Photo" value={form.imageUrl} onChange={val => setForm(p => ({ ...p, imageUrl: val }))} hint="Upload a photo of your venue." />
            <div className="vc-floor-section">
              <p className="vc-floor-section-title"><FaLayerGroup size={13} /> Floor Plan / Shape</p>
              <ImagePicker value={form.venueShape} onChange={val => setForm(p => ({ ...p, venueShape: val }))} presets={SHAPE_PRESETS} hint="Choose a preset or upload a custom floor plan." />
            </div>
            <div className="form-actions">
              <button type="submit" className="book-btn form-submit-btn" disabled={submitting}>{submitting ? "Registering..." : "Register Venue"}</button>
              <button type="button" className="btn-secondary form-back-btn" onClick={() => setView("list")}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {view === "list" && (
        venues.length === 0
          ? (
            <div className="empty-state">
              <div className="empty-state-icon-color"><FaBuilding size={32} /></div>
              <h3>No Venues Yet</h3>
              <p>Register your first venue to start receiving bookings.</p>
              <button className="book-btn empty-state-cta" onClick={() => setView("add")}>Register First Venue</button>
            </div>
          )
          : (
            <div className="cards-list">
              {venues.map(v => (
                <VenueCard key={v._id} venue={v} expanded={expanded === v._id}
                  onToggle={() => setExpanded(expanded === v._id ? null : v._id)}
                  onDelete={() => handleDelete(v._id)} onReviewAdded={fetchVenues} />
              ))}
            </div>
          )
      )}
    </div>
  );
};

const VenueCard = ({ venue, expanded, onToggle, onDelete }) => {
  const avg = venue.reviews?.length
    ? (venue.reviews.reduce((s, r) => s + r.rating, 0) / venue.reviews.length).toFixed(1)
    : null;

  const mapsUrl = venue.latitude && venue.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address} ${venue.city}`)}`;

  const statusClass = venue.status === "AVAILABLE" ? "venue-status-available" : "venue-status-booked";

  return (
    <div className="vc-wrap">
      <div className="vc-header">
        {venue.images?.[0]
          ? <img src={venue.images[0]} alt={venue.name} className="vc-thumb" />
          : <div className="vc-thumb-placeholder"><FaBuilding size={24} color="#c4b5fd" /></div>}
        <div className="vc-info">
          <div className="vc-info-top">
            <div>
              <h3 className="vc-name">{venue.name}</h3>
              <div className="vc-chips">
                <span className="meta-chip"><FaMapMarkerAlt size={11} /> {venue.city}, {venue.state}</span>
                <span className="meta-chip"><FaUsers size={11} /> {venue.capacity?.toLocaleString()} capacity</span>
                <span className="meta-chip"><FaMoneyBillWave size={11} /> ₹{venue.pricePerDay?.toLocaleString()}/day</span>
                {avg && <span className="meta-chip"><FaStar size={11} /> {avg} ({venue.reviews.length})</span>}
              </div>
            </div>
            <div className="vc-icon-btns">
              <span className={`status-badge ${statusClass}`}>{venue.status}</span>
              <button onClick={onDelete} className="vc-icon-btn vc-icon-btn-delete"><FaTrashAlt size={12} /></button>
              <button onClick={onToggle} className="vc-icon-btn vc-icon-btn-toggle">{expanded ? <FaChevronUp size={13} /> : <FaChevronDown size={13} />}</button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="vc-expanded">
          <div className={venue.venueShape ? "vc-detail-grid-2" : "vc-detail-grid-1"}>
            <div>
              {venue.address && <div className="vc-address-row"><FaMapMarkerAlt size={13} color="#7c3aed" /><span className="vc-address-text">{venue.address}</span></div>}
              {venue.layoutDescription && <p className="vc-desc">{venue.layoutDescription}</p>}
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="vc-maps-link"><FaExternalLinkAlt size={11} /> View on Google Maps</a>
            </div>
            {venue.venueShape && (
              <div>
                <p className="vc-floorplan-label"><FaLayerGroup size={13} color="#7c3aed" /> Floor Plan</p>
                <img src={venue.venueShape} alt="Venue layout" className="vc-floorplan-img" />
              </div>
            )}
          </div>
          <div className="vc-reviews">
            <p className="vc-reviews-title"><FaStar size={14} color="#f59e0b" /> Reviews ({venue.reviews?.length || 0})</p>
            {venue.reviews?.length > 0 && (
              <div className="vc-reviews-list">
                {venue.reviews.slice().reverse().map((r, i) => (
                  <div key={i} className="vc-review-item">
                    <div className="vc-review-header">
                      <span className="vc-review-name">{r.name}</span>
                      <div className="star-row">{[1,2,3,4,5].map(n => n <= r.rating ? <FaStar key={n} size={12} color="#f59e0b" /> : <FaRegStar key={n} size={12} color="#d1d5db" />)}</div>
                    </div>
                    <p className="vc-review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="vc-reviews-note">Reviews submitted by Users and Organisers who visited this venue.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, name, value, onChange, placeholder, type = "text", required, min, step }) => (
  <div className="field">
    <label>{label}</label>
    <input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} required={required} min={min} step={step} />
  </div>
);

export { toBase64, SHAPE_PRESETS };
export default ProviderDashboard;