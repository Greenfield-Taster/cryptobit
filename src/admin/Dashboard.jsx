import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "react-toastify";
import adminService from "../services/admin.service";
import StatisticsCard from "./StatisticsCard";
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    statusCounts: {},
    cryptoStats: [],
    dailyStats: [],
  });

  const fetchStatistics = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await adminService.exchangeService.getStatistics();

      if (response && response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error("Не удалось загрузить статистику");
        console.error("Неверный формат ответа:", response);
      }
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);

        toast.error(
          `Ошибка при загрузке статистики: ${error.response.status} - ${error.message}`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("Ошибка при загрузке статистики: Нет ответа от сервера");
      } else {
        console.error("Error message:", error.message);
        toast.error(`Ошибка при загрузке статистики: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();

    const interval = setInterval(fetchStatistics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStatistics]);

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">Загрузка статистики...</div>
      </div>
    );
  }

  const cryptoData = (stats.cryptoStats || []).map((item) => ({
    name: item._id,
    count: item.count,
    amount: parseFloat((item.totalAmount || 0).toFixed(2)),
  }));

  const safetyDailyStats = stats.dailyStats || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Панель управления</h2>
        <button
          className="refresh-btn"
          onClick={fetchStatistics}
          disabled={refreshing}
        >
          <i
            className={`fas ${
              refreshing ? "fa-spinner fa-spin" : "fa-sync-alt"
            }`}
          ></i>
          {refreshing ? "Обновление..." : "Обновить"}
        </button>
      </div>

      <div className="stats-overview">
        <StatisticsCard
          title="Всего заявок"
          value={stats.totalRequests || 0}
          icon="fa-chart-line"
          color="primary"
        />

        <StatisticsCard
          title="Ожидающие"
          value={(stats.statusCounts && stats.statusCounts.pending) || 0}
          icon="fa-clock"
          color="warning"
        />

        <StatisticsCard
          title="В обработке"
          value={(stats.statusCounts && stats.statusCounts.processing) || 0}
          icon="fa-spinner"
          color="info"
        />

        <StatisticsCard
          title="Завершенные"
          value={(stats.statusCounts && stats.statusCounts.completed) || 0}
          icon="fa-check-circle"
          color="success"
        />

        <StatisticsCard
          title="Неудачные"
          value={(stats.statusCounts && stats.statusCounts.failed) || 0}
          icon="fa-exclamation-circle"
          color="danger"
        />
      </div>

      <div className="chart-container">
        <h3>Активность за последние 7 дней</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={safetyDailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Количество заявок"
              stroke="#556ee6"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Статистика по криптовалютам</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cryptoData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#556ee6" />
            <YAxis yAxisId="right" orientation="right" stroke="#34c38f" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="Количество заявок"
              fill="#556ee6"
            />
            <Bar
              yAxisId="right"
              dataKey="amount"
              name="Общая сумма"
              fill="#34c38f"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
