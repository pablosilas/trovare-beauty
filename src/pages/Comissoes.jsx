import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const barberColors = ["#C9A84C", "#7C6F5E", "#4A7C6F", "#818cf8", "#f472b6"];

export default function Comissoes() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBarber, setFilterBarber] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/beauty/commissions");
      setCommissions(data);
    } catch (e) {
      console.error("Erro ao buscar comissões:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);
  useAutoRefresh(fetchCommissions, 30000); // ← atualiza a cada 30s

  async function togglePaid(id) {
    try {
      await api.put(`/beauty/commissions/${id}`);
      await fetchCommissions();
    } catch (e) {
      console.error("Erro ao atualizar comissão:", e);
    }
  }

  async function markAllPaid(barberId) {
    try {
      const pending = commissions.filter(c => c.barberId === barberId && !c.paid);
      await Promise.all(pending.map(c => api.put(`/beauty/commissions/${c.id}`)));
      await fetchCommissions();
    } catch (e) {
      console.error("Erro ao pagar comissões:", e);
    }
  }

  const barbers = [...new Map(commissions.map(c => [c.barberId, c.barber])).values()];

  const filtered = commissions.filter(c => {
    const matchBarber = filterBarber === "all" || String(c.barberId) === filterBarber;
    const matchPaid = filterPaid === "all" || (filterPaid === "paid" ? c.paid : !c.paid);
    return matchBarber && matchPaid;
  });

  const totalAll = commissions.reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter(c => !c.paid).reduce((s, c) => s + c.amount, 0);
  const totalPaid = commissions.filter(c => c.paid).reduce((s, c) => s + c.amount, 0);

  const summary = barbers.map((b, idx) => ({
    ...b,
    color: barberColors[idx % barberColors.length],
    pending: commissions.filter(c => c.barberId === b.id && !c.paid).reduce((s, c) => s + c.amount, 0),
    paid: commissions.filter(c => c.barberId === b.id && c.paid).reduce((s, c) => s + c.amount, 0),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando comissões...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="t-text text-lg font-semibold">Comissões</h1>
        <p className="t-muted text-xs mt-0.5">Controle de repasse por barbeiro</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total do Período", value: `R$ ${totalAll.toFixed(2)}`, color: "#818cf8" },
          { label: "Pendente", value: `R$ ${totalPending.toFixed(2)}`, color: "var(--gold)" },
          { label: "Pago", value: `R$ ${totalPaid.toFixed(2)}`, color: "#4ade80" },
        ].map((s, i) => (
          <div key={i} className="t-card rounded-xl p-5">
            <div className="t-faint text-[11px] uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Resumo por barbeiro */}
      {summary.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {summary.map(s => (
            <div key={s.id} className="t-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: s.color + "20", border: `1px solid ${s.color}40`, color: s.color }}>
                    {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="t-text text-sm font-medium">{s.name.split(" ")[0]}</span>
                </div>
                {s.pending > 0 && (
                  <button onClick={() => markAllPaid(s.id)}
                    className="text-[10px] text-[#4ade80] px-2 py-1 rounded cursor-pointer hover:opacity-75 transition-opacity"
                    style={{ background: "#4ade8020" }}>
                    Pagar tudo
                  </button>
                )}
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="t-muted">Pendente</span>
                <span style={{ color: "var(--gold)" }}>R$ {s.pending.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="t-muted">Pago</span>
                <span className="text-[#4ade80]">R$ {s.paid.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3">
        <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}
          className="t-select text-sm px-3 py-2 rounded-lg cursor-pointer">
          <option value="all">Todos os barbeiros</option>
          {barbers.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
        <div className="flex gap-2">
          {[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendente" },
            { value: "paid", label: "Pago" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterPaid(f.value)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                background: filterPaid === f.value ? "var(--gold-bg)" : "transparent",
                color: filterPaid === f.value ? "var(--gold)" : "var(--text-muted)",
                borderColor: filterPaid === f.value ? "var(--gold-border)" : "var(--border)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="t-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="t-row">
                {["Data", "Barbeiro", "Serviço", "Valor serviço", "Comissão", "Status", "Ação"].map(h => (
                  <th key={h} className="t-th px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center t-faint text-sm">Nenhum registro encontrado</td></tr>
              ) : (
                filtered.map((c, i) => {
                  const idx = barbers.findIndex(b => b.id === c.barberId);
                  const color = barberColors[idx % barberColors.length] || "#888";
                  return (
                    <tr key={c.id} className={i < filtered.length - 1 ? "t-row" : ""}>
                      <td className="px-5 py-3 t-muted text-sm">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: color + "20", color }}>
                            {c.barber?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="t-text text-sm">{c.barber?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 t-muted text-sm">{c.booking?.service}</td>
                      <td className="px-5 py-3 t-muted text-sm">R$ {c.booking?.price}</td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color }}>R$ {c.amount.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] px-2 py-1 rounded ${c.paid ? "tag-confirmed" : "tag-in-progress"}`}>
                          {c.paid ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => togglePaid(c.id)}
                          className="text-[11px] transition-colors cursor-pointer hover:opacity-75"
                          style={{ color: c.paid ? "#f87171" : "#4ade80" }}>
                          {c.paid ? "Estornar" : "Pagar"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}