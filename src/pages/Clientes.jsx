import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const loyaltyConfig = {
  VIP: { className: "tag-vip" },
  Regular: { className: "tag-regular" },
  Novo: { className: "tag-novo" },
};

const emptyForm = { name: "", phone: "", email: "", loyalty: "Novo", notes: "" };

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterLoyalty, setFilterLoyalty] = useState("all");

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/beauty/clients");
      setClients(data);
    } catch (e) {
      console.error("Erro ao buscar clientes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useAutoRefresh(fetchClients, 30000); // ← atualiza a cada 30s

  function openNew() {
    setSelected(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(c) {
    setSelected(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, loyalty: c.loyalty, notes: c.notes });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) return;
    try {
      if (selected) {
        await api.put(`/beauty/clients/${selected.id}`, form);
      } else {
        await api.post("/beauty/clients", form);
      }
      await fetchClients();
      setShowModal(false);
    } catch (e) {
      console.error("Erro ao salvar cliente:", e);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/beauty/clients/${id}`);
      await fetchClients();
    } catch (e) {
      console.error("Erro ao deletar cliente:", e);
    }
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchLoyalty = filterLoyalty === "all" || c.loyalty === filterLoyalty;
    return matchSearch && matchLoyalty;
  });

  const totalSpent = clients.reduce((sum, c) => sum + c.spent, 0);
  const vipCount = clients.filter(c => c.loyalty === "VIP").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-text text-lg font-semibold">Clientes</h1>
          <p className="t-muted text-xs mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
        <button onClick={openNew}
          className="t-btn-primary text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de Clientes", value: clients.length, color: "#818cf8" },
          { label: "Clientes VIP", value: vipCount, color: "var(--gold)" },
          { label: "Receita Total", value: `R$ ${totalSpent.toLocaleString("pt-BR")}`, color: "#4ade80" },
        ].map((s, i) => (
          <div key={i} className="t-card rounded-xl p-5">
            <div className="t-faint text-[11px] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input type="text" placeholder="Buscar por nome ou telefone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 t-input text-sm px-4 py-2 rounded-lg transition-colors"
        />
        <div className="flex gap-2">
          {["all", "VIP", "Regular", "Novo"].map(f => (
            <button key={f} onClick={() => setFilterLoyalty(f)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                background: filterLoyalty === f ? "var(--gold-bg)" : "transparent",
                color: filterLoyalty === f ? "var(--gold)" : "var(--text-muted)",
                borderColor: filterLoyalty === f ? "var(--gold-border)" : "var(--border)",
              }}>
              {f === "all" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="t-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="t-row">
                {["Cliente", "Telefone", "Visitas", "Última visita", "Total gasto", "Fidelidade", "Ações"].map(h => (
                  <th key={h} className="t-th px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center t-faint text-sm">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  return (
                    <tr key={c.id} className={i < filtered.length - 1 ? "t-row" : ""}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="t-inner w-8 h-8 rounded-full flex items-center justify-center text-[11px] t-muted">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="t-text text-sm">{c.name}</div>
                            {c.notes && <div className="t-muted text-[10px] truncate max-w-[160px]">{c.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 t-muted text-sm">{c.phone}</td>
                      <td className="px-5 py-3 t-muted text-sm">{c.visits}x</td>
                      <td className="px-5 py-3 t-muted text-sm">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--gold)" }}>
                        R$ {Number(c.spent).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] px-2 py-1 rounded ${loyaltyConfig[c.loyalty]?.className || "tag-novo"}`}>
                          {c.loyalty}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(c)}
                            className="text-[11px] cursor-pointer hover:opacity-75 transition-opacity"
                            style={{ color: "var(--gold)" }}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="text-[11px] text-[#f87171] cursor-pointer hover:opacity-75 transition-opacity">
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="t-modal rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="t-text text-sm font-semibold">{selected ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button onClick={() => setShowModal(false)} className="t-muted hover:opacity-75 cursor-pointer text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Nome</label>
                <input type="text" placeholder="Nome completo" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Telefone</label>
                <input type="text" placeholder="(11) 99999-0000" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">E-mail</label>
                <input type="email" placeholder="email@exemplo.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Fidelidade</label>
                <select value={form.loyalty} onChange={e => setForm(f => ({ ...f, loyalty: e.target.value }))}
                  className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                  <option value="Novo">Novo</option>
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Observações</label>
                <textarea placeholder="Preferências, alergias..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg resize-none"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 t-inner t-muted text-sm py-2 rounded-lg transition-colors cursor-pointer t-hover">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 t-btn-primary text-sm py-2 rounded-lg transition-colors cursor-pointer">
                  {selected ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}