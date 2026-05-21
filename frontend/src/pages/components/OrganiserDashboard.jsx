import { useState, useEffect, useCallback } from "react";
import {
  FaCalendarAlt, FaPlus, FaSearch, FaMapMarkerAlt, FaUsers,
  FaMoneyBillWave, FaTrashAlt, FaChevronDown, FaChevronUp,
  FaTimes, FaHashtag, FaImage, FaCheck, FaExternalLinkAlt, FaLayerGroup, FaPalette,
} from "react-icons/fa";
import { getVenues } from "../../api/venues";
import { getMyEvents, createEvent, deleteEvent, updateEventStatus, getEventAttendees } from "../../api/events";
import { ImagePicker } from "./ProviderDashboard";
const TICKET_THEMES = [
  { id: "red", label: "Red", image: "/redtick.png" },
  { id: "green", label: "Green", image: "/greentick.png" },
  { id: "yellow", label: "Yellow", image: "/yellowtick.png" },
  { id: "blue", label: "Blue", image: "/bluetick.png" },
];

const EMPTY_FORM = { 
  title: "", 
  description: "", 
  date: "", 
  endDate: "", 
  ticketPrice: "",
  totalTickets: "", 
  bannerImage: "", 
  photos: [], 
  hashtags: [],
  ticketTheme: "",
};

const OrganiserDashboard = () => {
  const [view, setView] = useState("events");
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [attendees, setAttendees] = useState({});
  const [hashtagInput, setHashtagInput] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchEvents = useCallback(async () => {
    const data = await getMyEvents();
    setEvents(data);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearchVenues = async () => {
    const data = await getVenues(citySearch, stateSearch);
    setVenues(data);
  };

  const addHashtag = () => {
    const tag = hashtagInput.replace(/^#/, "").trim();
    if (tag && !form.hashtags.includes(tag)) setForm(p => ({ ...p, hashtags: [...p.hashtags, tag] }));
    setHashtagInput("");
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await createEvent({ ...form, venueId: selectedVenue._id, status: "Live" });
    setForm(EMPTY_FORM);
    setSelectedVenue(null);
    setView("events");
    fetchEvents();
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    await deleteEvent(id);
    setEvents(p => p.filter(e => e._id !== id));
  };

  const handleStatusChange = async (id, status) => {
    const updated = await updateEventStatus(id, status);
    setEvents(p => p.map(e => e._id === id ? updated : e));
  };

  const loadAttendees = async (eventId) => {
    if (attendees[eventId]) { setExpandedEvent(p => p === eventId ? null : eventId); return; }
    const data = await getEventAttendees(eventId);
    setAttendees(p => ({ ...p, [eventId]: data }));
    setExpandedEvent(eventId);
  };

  const totalSold  = events.reduce((s, e) => s + (e.soldTickets || 0), 0);
  const liveCount  = events.filter(e => e.status === "Live").length;
  const draftCount = events.filter(e => e.status === "Draft").length;
  const cancelCount = events.reduce((s, e) => s + (e.cancelledTickets || 0), 0);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{events.length}</div><div className="stat-label">Total Events</div></div>
        <div className="stat-card highlight"><div className="stat-value">{liveCount}</div><div className="stat-label">Live Now</div></div>
        <div className="stat-card"><div className="stat-value">{draftCount}</div><div className="stat-label">Drafts</div></div>
        <div className="stat-card"><div className="stat-value">{totalSold}</div><div className="stat-label">Tickets Sold</div></div>
        <div className="stat-card"><div className="stat-value">{cancelCount}</div><div className="stat-label">Cancellations</div></div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${view === "events" ? "tab-btn-primary" : "tab-btn-secondary"}`} onClick={() => setView("events")}><FaCalendarAlt size={13} /> My Events</button>
        <button className={`tab-btn ${view === "discover" || view === "create" ? "tab-btn-primary" : "tab-btn-secondary"}`} onClick={() => setView("discover")}><FaSearch size={13} /> Discover Venues</button>
        {selectedVenue && <button className={`tab-btn ${view === "create" ? "tab-btn-primary" : "tab-btn-secondary"}`} onClick={() => setView("create")}><FaPlus size={13} /> Create at {selectedVenue.name}</button>}
      </div>

      {view === "events" && (
        events.length === 0
          ? <div className="empty-state"><div className="empty-state-icon-color">
              <FaCalendarAlt size={32} />
            </div>
              <h3>No Events Yet</h3>
              <p>Find a venue and create your first event.</p>
              <button className="book-btn empty-state-cta" onClick={() => setView("discover")}>Find a Venue</button>
            </div>
          : <div className="cards-list">{events.map(event => <EventCard key={event._id} event={event} expanded={expandedEvent === event._id} attendees={attendees[event._id]} onToggleAttendees={() => loadAttendees(event._id)} onDelete={() => handleDelete(event._id)} onStatusChange={status => handleStatusChange(event._id, status)} />)}</div>
      )}

      {view === "discover" && (
        <div>
          <div className="panel">
            <div className="panel-title"><FaSearch size={14} /> Search Venues by Location</div>
            <div className="filter-bar">
              <div className="field"><label>City</label><input placeholder="e.g. Mumbai" value={citySearch} onChange={e => setCitySearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearchVenues()} /></div>
              <div className="field"><label>State</label><input placeholder="e.g. Maharashtra" value={stateSearch} onChange={e => setStateSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearchVenues()} /></div>
              <button className="book-btn filter-search-btn" onClick={handleSearchVenues}>Search</button>
            </div>
          </div>
          {venues.length > 0 && (
            <div className="cards-list">
              <p className="venues-count">{venues.length} venue{venues.length !== 1 ? "s" : ""} found</p>
              {venues.map(venue => <VenueSelectCard key={venue._id} venue={venue} selected={selectedVenue?._id === venue._id} onSelect={() => { setSelectedVenue(venue); setView("create"); }} />)}
            </div>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="panel">
          <div className="panel-title"><FaPlus size={14} /> Create Event at {selectedVenue?.name}</div>
          {selectedVenue && (
            <div className="venue-info-box">
              <FaMapMarkerAlt size={16} color="#16a34a" />
              <div className="venue-info-box-body">
                <p className="venue-info-name">{selectedVenue.name}</p>
                <p className="venue-info-meta">{selectedVenue.city}, {selectedVenue.state} · Capacity: {selectedVenue.capacity?.toLocaleString()}</p>
              </div>
              <button className="btn-secondary btn-change" onClick={() => setView("discover")}>Change</button>
            </div>
          )}
          <form onSubmit={handleCreateEvent}>
            <div className="form-grid">
              <div className="field form-full"><label>Event Title *</label><input required placeholder="e.g. Tech Summit 2026" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="field"><label>Start Date &amp; Time *</label><input type="datetime-local" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="field"><label>End Date &amp; Time</label><input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
              <div className="field"><label>Ticket Price (₹) *</label><input type="number" required min="0" placeholder="999" value={form.ticketPrice} onChange={e => setForm(p => ({ ...p, ticketPrice: e.target.value }))} /></div>
              <div className="field"><label>Total Tickets *</label><input type="number" required min="1" max={selectedVenue?.capacity} placeholder={`Max ${selectedVenue?.capacity}`} value={form.totalTickets} onChange={e => setForm(p => ({ ...p, totalTickets: e.target.value }))} /></div>
              <div className="field form-full"><ImagePicker label="Banner Image" value={form.bannerImage} onChange={val => setForm(p => ({ ...p, bannerImage: val }))} hint="Upload an event banner." /></div>
              <div className="field form-full"><label>Description *</label><textarea required placeholder="Describe your event..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="field form-full">
                <label>Hashtags</label>
                <div className="hashtag-input-row">
                  <input className="hashtag-text-input" value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} placeholder="#music #tech" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHashtag(); } }} />
                  <button type="button" onClick={addHashtag} className="btn-secondary hashtag-add-btn"><FaHashtag size={13} /></button>
                </div>
                {form.hashtags.length > 0 && (
                  <div className="hashtag-pills">
                    {form.hashtags.map(tag => (
                      <span key={tag} className="hashtag-pill">#{tag}<button type="button" onClick={() => setForm(p => ({ ...p, hashtags: p.hashtags.filter(t => t !== tag) }))} className="hashtag-pill-remove"><FaTimes size={10} /></button></span>
                    ))}
                  </div>
                )}
              </div>
              <div className="field form-full">
                <label><FaPalette size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Ticket Theme</label>
                <p className="field-hint">Choose a theme for your event tickets.</p>
                <div className="ticket-theme-grid">
                  {TICKET_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`ticket-theme-card${form.ticketTheme === theme.image ? " ticket-theme-selected" : ""}`}
                      onClick={() => setForm(p => ({ ...p, ticketTheme: p.ticketTheme === theme.image ? "" : theme.image }))}
                    >
                      <img src={theme.image} alt={theme.label} className="ticket-theme-img" />
                      <span className="ticket-theme-label">{theme.label}</span>
                      {form.ticketTheme === theme.image && <span className="ticket-theme-check"><FaCheck size={12} /></span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field form-full">
                <ImagePicker label="Additional Photos" value="" onChange={val => { if (val) setForm(p => ({ ...p, photos: [...p.photos, val] })); }} hint="Each upload adds to the gallery." />
                {form.photos.length > 0 && (
                  <div className="photo-gallery">
                    {form.photos.map((url, i) => (
                      <div key={i} className="photo-thumb-wrap">
                        <img src={url} alt="" className="photo-thumb" />
                        <button type="button" className="photo-thumb-remove" onClick={() => setForm(p => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))}><FaTimes size={8} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="book-btn form-submit-btn" disabled={submitting}>{submitting ? "Publishing..." : "Publish Event"}</button>
              <button type="button" className="btn-secondary form-back-btn" onClick={() => setView("discover")}>Back</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event, expanded, attendees, onToggleAttendees, onDelete, onStatusChange }) => {
  const sold = event.soldTickets || 0;
  const total = event.totalTickets || 1;
  const pct = Math.min(100, Math.round((sold / total) * 100));
  const fillClass = pct > 80 ? "high" : pct > 50 ? "mid" : "low";
  const statusClass = event.status === "Live" ? "event-status-live" : event.status === "Draft" ? "event-status-draft" : "event-status-completed";
  const mapsUrl = event.venueId?.latitude && event.venueId?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${event.venueId.latitude},${event.venueId.longitude}` : null;

  return (
    <div className="ec-wrap">
      {event.bannerImage && <img src={event.bannerImage} alt={event.title} className="ec-banner" />}
      <div className="ec-body">
        <div className="ec-header">
          <div>
            <span className={`event-status-badge ${statusClass}`}>{event.status}</span>
            <h3 className="ec-title">{event.title}</h3>
            <div className="ec-chips">
              <span className="meta-chip"><FaMapMarkerAlt size={11} /> {event.venueId?.name}, {event.venueId?.city}</span>
              <span className="meta-chip"><FaCalendarAlt size={11} /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="meta-chip"><FaMoneyBillWave size={11} /> ₹{Number(event.ticketPrice).toLocaleString()}</span>
            </div>
            {event.hashtags?.length > 0 && <div className="ec-hashtags">{event.hashtags.map(t => <span key={t} className="ec-hashtag">#{t}</span>)}</div>}
          </div>
          <div className="ec-actions">
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="ec-icon-btn ec-icon-btn-map"><FaExternalLinkAlt size={11} /> Map</a>}
            <button onClick={onDelete} className="ec-icon-btn ec-icon-btn-delete"><FaTrashAlt size={12} /></button>
            <button onClick={onToggleAttendees} className="ec-icon-btn ec-icon-btn-attendees"><FaUsers size={13} /> Attendees {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}</button>
          </div>
        </div>
        <div className="ec-stats">
          <span className="ec-stat-text"><strong>{sold}</strong> sold</span>
          <span className="ec-stat-text"><strong>{total - sold}</strong> remaining</span>
          {event.cancelledTickets > 0 && <span className="ec-stat-cancelled"><strong>{event.cancelledTickets}</strong> cancelled</span>}
        </div>
        <div className="ec-progress-track"><div className={`ec-progress-fill ${fillClass}`} style={{ width: `${pct}%` }} /></div>
        <div className="ec-status-actions">
          {event.status === "Draft" && <button className="btn-success status-action-btn" onClick={() => onStatusChange("Live")}><FaCheck size={12} /> Publish Live</button>}
          {event.status === "Live" && <button className="btn-secondary status-action-btn" onClick={() => onStatusChange("Completed")}>Mark Completed</button>}
        </div>
      </div>
      {expanded && (
        <div className="ec-attendees">
          <p className="ec-attendees-title"><FaUsers size={14} color="#7c3aed" /> Registered Attendees ({attendees?.length || 0})</p>
          {!attendees?.length
            ? <p className="text-muted-sm">No bookings yet.</p>
            : <div className="ec-attendees-list">
                {attendees.map((ticket, i) => (
                  <div key={ticket._id} className="ec-attendee-row">
                    <div className="ec-attendee-num">{i + 1}</div>
                    <div className="ec-attendee-info">
                      <p className="ec-attendee-name">{ticket.userId?.name}</p>
                      <p className="ec-attendee-email">{ticket.userId?.email}</p>
                    </div>
                    <div className="ec-attendee-meta">
                      <p className="ec-attendee-booking">#{ticket.bookingId?.split("-")[0]}</p>
                      <p className="ec-attendee-date">{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
};

const VenueSelectCard = ({ venue, selected, onSelect }) => {
  const mapsUrl = venue.latitude && venue.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.city}`)}`;
  const hasTwo = venue.images?.[0] && venue.venueShape;

  return (
    <div onClick={onSelect} className={`venue-select-card${selected ? " selected" : ""}`}>
      <div className="venue-select-card-header">
        <div>
          <h4 className="venue-select-card-name">{venue.name}</h4>
          <div className="venue-select-card-meta">
            <span className="meta-chip"><FaMapMarkerAlt size={11} /> {venue.city}, {venue.state}</span>
            <span className="meta-chip"><FaUsers size={11} /> {venue.capacity?.toLocaleString()} capacity</span>
            <span className="meta-chip"><FaMoneyBillWave size={11} /> ₹{venue.pricePerDay?.toLocaleString()}/day</span>
          </div>
        </div>
        {selected && <FaCheck size={18} color="#16a34a" />}
      </div>
      {venue.layoutDescription && <p className="venue-select-card-desc">{venue.layoutDescription}</p>}
      {(venue.images?.[0] || venue.venueShape) && (
        <div className={hasTwo ? "venue-img-grid-2" : "venue-img-grid-1"}>
          {venue.images?.[0] && <div><p className="venue-img-label"><FaImage size={11} color="#7c3aed" /> Venue Photo</p><img src={venue.images[0]} alt={venue.name} className="venue-img-photo" onClick={e => e.stopPropagation()} /></div>}
          {venue.venueShape && <div><p className="venue-img-label"><FaLayerGroup size={11} color="#7c3aed" /> Floor Plan</p><img src={venue.venueShape} alt="Floor plan" className="venue-img-floorplan" onClick={e => e.stopPropagation()} /></div>}
        </div>
      )}
      <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="venue-map-link"><FaExternalLinkAlt size={10} /> View Location</a>
    </div>
  );
};

export default OrganiserDashboard;