import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const services = [
  { name: "Corte Social", price: 40 },
  { name: "Corte Degradê", price: 45 },
  { name: "Corte + Barba", price: 65 },
  { name: "Barba", price: 35 },
  { name: "Corte + Sobrancelha", price: 55 },
  { name: "Hidratação", price: 30 },
];

const statusConfig = {
  confirmed: { label: "Confirmado", className: "tag-confirmed", dot: "#16a34a" },
  in_progress: { label: "Em atendimento", className: "tag-in-progress", dot: "#d97706" },
  pending: { label: "Pendente", className: "tag-pending", dot: "#7c3aed" },
  cancelled: { label: "Cancelado", className: "tag-cancelled", dot: "#dc2626" },
  completed: { label: "Concluído", className: "tag-completed", dot: "#6b7280" },
};

const emptyForm = {
  clientId: "", barberId: "", service: "", date: "", time: "", price: "", status: "confirmed",
};

export default function Agendamentos() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");


  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [b, c, bar] = await Promise.all([
        api.get("/beauty/bookings"),
        api.get("/beauty/clients"),
        api.get("/beauty/barbers"),
      ]);
      setBookings(b.data);
      setClients(c.data);
      setBarbers(bar.data);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useAutoRefresh(fetchAll, 30000);

  function handleServiceChange(serviceName) {
    const found = services.find(s => s.name === serviceName);
    setForm(f => ({ ...f, service: serviceName, price: found ? found.price : "" }));
  }

  async function handleSubmit() {
    if (!form.clientId || !form.barberId || !form.service || !form.date || !form.time) return;
    try {
      await api.post("/beauty/bookings", form);
      await fetchAll();
      setForm(emptyForm);
      setShowModal(false);
    } catch (e) {
      console.error("Erro ao criar agendamento:", e);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/beauty/bookings/${id}`);
      await fetchAll();
    } catch (e) {
      console.error("Erro ao deletar agendamento:", e);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.put(`/beauty/bookings/${id}`, { status });
      await fetchAll();
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
    }
  }

  const filtered = bookings.filter(b => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch = b.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.barber?.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-text text-lg font-semibold">Agendamentos</h1>
          <p className="t-muted text-xs mt-0.5">{bookings.length} agendamentos no total</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
          className="t-btn-primary text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input type="text" placeholder="Buscar cliente ou barbeiro..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 t-input text-sm px-4 py-2 rounded-lg transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "Todos" },
            { value: "confirmed", label: "Confirmado" },
            { value: "in_progress", label: "Em atendimento" },
            { value: "pending", label: "Pendente" },
            { value: "completed", label: "Concluído" },
            { value: "cancelled", label: "Cancelado" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                background: filterStatus === f.value ? "var(--gold-bg)" : "transparent",
                color: filterStatus === f.value ? "var(--gold)" : "var(--text-muted)",
                borderColor: filterStatus === f.value ? "var(--gold-border)" : "var(--border)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="t-card rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="t-row">
              {["Horário", "Cliente", "Serviço", "Barbeiro", "Valor", "Status", "Ações"].map(h => (
                <th key={h} className="t-th px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center t-faint text-sm">
                  Nenhum agendamento encontrado
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => {
                return (
                  <tr key={b.id} className={i < filtered.length - 1 ? "t-row" : ""}>
                    <td className="px-5 py-3 t-muted text-sm">{b.time} · {b.date}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="t-inner w-7 h-7 rounded-full flex items-center justify-center text-[11px] t-muted">
                          {b.client?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="t-text text-sm">{b.client?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 t-muted text-sm">{b.service}</td>
                    <td className="px-5 py-3 t-muted text-sm">{b.barber?.name}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--gold)" }}>R$ {b.price}</td>
                    <td className="px-5 py-3">
                      <select value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                        className={`text-[10px] px-2 py-1 rounded border-none outline-none cursor-pointer ${statusConfig[b.status]?.className}`}>
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(b.id)}
                        className="text-[11px] text-[#f87171] hover:opacity-75 transition-opacity cursor-pointer">
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="t-modal rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="t-text text-sm font-semibold">Novo Agendamento</h2>
              <button onClick={() => setShowModal(false)} className="t-muted hover:opacity-75 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-3">

              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Cliente</label>
                <select value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Barbeiro</label>
                <select value={form.barberId}
                  onChange={e => setForm(f => ({ ...f, barberId: e.target.value }))}
                  className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                  <option value="">Selecione um barbeiro</option>
                  {barbers.filter(b => b.status === "active").map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Serviço</label>
                <select value={form.service} onChange={e => handleServiceChange(e.target.value)}
                  className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                  <option value="">Selecione um serviço</option>
                  {services.map(s => (
                    <option key={s.name} value={s.name}>{s.name} — R$ {s.price}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Data</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="t-input w-full text-sm px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Horário</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="t-input w-full text-sm px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Valor (R$)</label>
                <input type="number" placeholder="0" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 t-inner t-muted text-sm py-2 rounded-lg transition-colors cursor-pointer t-hover">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 t-btn-primary text-sm py-2 rounded-lg transition-colors cursor-pointer">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}