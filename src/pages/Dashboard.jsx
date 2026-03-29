import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const statusConfig = {
  confirmed: { label: "Confirmado", className: "tag-confirmed", dot: "#16a34a" },
  in_progress: { label: "Em atendimento", className: "tag-in-progress", dot: "#d97706" },
  pending: { label: "Pendente", className: "tag-pending", dot: "#7c3aed" },
  cancelled: { label: "Cancelado", className: "tag-cancelled", dot: "#dc2626" },
  completed: { label: "Concluído", className: "tag-completed", dot: "#6b7280" },
};

const loyaltyConfig = {
  VIP: { className: "tag-vip" },
  Regular: { className: "tag-regular" },
  Novo: { className: "tag-novo" },
};

const barberColors = ["#C9A84C", "#7C6F5E", "#4A7C6F", "#818cf8", "#f472b6"];

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [b, c, bar, com, tr] = await Promise.all([
        api.get("/bookings"),
        api.get("/clients"),
        api.get("/barbers"),
        api.get("/commissions"),
        api.get("/transactions"),
      ]);
      setBookings(b.data);
      setClients(c.data);
      setBarbers(bar.data);
      setCommissions(com.data);
      setTransactions(tr.data);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useAutoRefresh(fetchAll, 30000);

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalComm = commissions.reduce((s, c) => s + c.amount, 0);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBooks = bookings.filter(b => b.date === todayStr);

  const stats = [
    { label: "Faturamento Total", value: `R$ ${income.toLocaleString("pt-BR")}`, sub: `${transactions.filter(t => t.type === "income").length} receitas`, color: "var(--gold)", icon: "◆" },
    { label: "Agendamentos", value: bookings.length, sub: `${todayBooks.length} hoje`, color: "#4ade80", icon: "◷" },
    { label: "Clientes", value: clients.length, sub: `${clients.filter(c => c.loyalty === "VIP").length} VIPs`, color: "#818cf8", icon: "◎" },
    { label: "Comissões", value: `R$ ${totalComm.toFixed(0)}`, sub: `${commissions.filter(c => !c.paid).length} pendentes`, color: "#f472b6", icon: "✦" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="t-card rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="t-faint text-[11px] uppercase tracking-wider">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="t-faint text-[11px]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Agendamentos recentes */}
        <div className="col-span-1 lg:col-span-3 t-card rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 t-row">
            <span className="t-text text-sm font-medium">Agendamentos Recentes</span>
            <span className="t-muted text-xs">{bookings.length} total</span>
          </div>
          <div>
            {bookings.length === 0 ? (
              <div className="px-5 py-8 text-center t-faint text-sm">Nenhum agendamento ainda</div>
            ) : (
              bookings.slice(0, 5).map((b, i) => {
                const cfg = statusConfig[b.status] || statusConfig.pending;
                return (
                  <div key={b.id} className={`flex items-center gap-3 px-5 py-3 ${i < 4 ? "t-row" : ""}`}>
                    <span className="t-muted text-xs w-10 shrink-0">{b.time}</span>
                    <div className="w-1 h-8 rounded-full shrink-0"
                      style={{ background: cfg.dot }} />
                    <div className="flex-1">
                      <div className="t-text text-sm font-medium">{b.client?.name}</div>
                      <div className="t-muted text-xs">{b.service} · {b.barber?.name}</div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--gold)" }}>R$ {b.price}</span>
                    <span className={`text-[10px] px-2 py-1 rounded ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Barbeiros */}
        <div className="col-span-1 lg:col-span-2 t-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 t-row">
            <span className="t-text text-sm font-medium">Barbeiros</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {barbers.length === 0 ? (
              <div className="t-faint text-sm text-center py-4">Nenhum barbeiro cadastrado</div>
            ) : (
              barbers.map((b, idx) => {
                const color = barberColors[idx % barberColors.length];
                const barberBookings = bookings.filter(bk => bk.barberId === b.id);
                const barberCommission = commissions.filter(c => c.barberId === b.id && !c.paid)
                  .reduce((s, c) => s + c.amount, 0);
                return (
                  <div key={b.id} className="t-inner rounded-lg p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ background: color + "25", border: `1px solid ${color}50`, color }}>
                      {b.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="t-text text-sm font-medium truncate">{b.name}</div>
                      <div className="t-muted text-xs">{barberBookings.length} atend. · R$ {barberCommission.toFixed(0)} pendente</div>
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: b.status === "active" ? "#4ade80" : "#555",
                        boxShadow: b.status === "active" ? "0 0 6px #4ade80" : "none",
                      }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Clientes */}
      <div className="t-card rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 t-row">
          <span className="t-text text-sm font-medium">Clientes</span>
          <span className="t-muted text-xs">Total: {clients.length}</span>
        </div>
        {clients.length === 0 ? (
          <div className="px-5 py-8 text-center t-faint text-sm">Nenhum cliente cadastrado</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="t-row">
                {["Cliente", "Visitas", "Última visita", "Total gasto", "Fidelidade"].map(h => (
                  <th key={h} className="t-th px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 5).map((c, i) => {
                const lc = loyaltyConfig[c.loyalty] || loyaltyConfig["Novo"];
                return (
                  <tr key={c.id} className={i < 4 ? "t-row" : ""}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="t-inner w-7 h-7 rounded-full flex items-center justify-center text-[11px] t-muted">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="t-text text-sm">{c.name}</span>
                      </div>
                    </td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}