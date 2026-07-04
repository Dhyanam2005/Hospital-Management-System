import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function Charts() {
  const [firstInfo, setFirstInfo]   = useState([]);
  const [secondInfo, setSecondInfo] = useState([]);
  const [thirdInfo, setThirdInfo]   = useState([]);
  const [fourthInfo, setFourthInfo] = useState([]);
  const [fifthInfo, setFifthInfo]   = useState([]);
  const [date, setDate]             = useState([]);
  const [seventhInfo, setSeventhInfo] = useState([]);
  const [eighthInfo, setEighthInfo]   = useState([]);
  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626'];

  const renderCustomizedLabel = ({ name, percent }) =>
    `${name}: ${(percent * 100).toFixed(0)}%`;

  const setAdmittedAndDischarged = (admitted, discharged) => {
    const dataMap = {};
    admitted.forEach(({ date, admission_count }) => {
      if (!dataMap[date]) dataMap[date] = { date, admission_count: 0, discharge_count: 0 };
      dataMap[date].admission_count = admission_count;
    });
    discharged.forEach(({ date, discharge_count }) => {
      if (date !== 'Pending') {
        if (!dataMap[date]) dataMap[date] = { date, admission_count: 0, discharge_count: 0 };
        dataMap[date].discharge_count = discharge_count;
      }
    });
    return Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [res1, res2, res3, res4, res5, res6, res7, res8] = await Promise.all([
          authFetch(`${API_BASE_URL}/firstChart`),
          authFetch(`${API_BASE_URL}/secondChart`),
          authFetch(`${API_BASE_URL}/thirdChart`),
          authFetch(`${API_BASE_URL}/fourthChart`),
          authFetch(`${API_BASE_URL}/fifthChart`),
          authFetch(`${API_BASE_URL}/sixthChart`),
          authFetch(`${API_BASE_URL}/seventhChart`),
          authFetch(`${API_BASE_URL}/eighthChart`),
        ]);
        if (res1.ok && res2.ok && res3.ok && res4.ok && res5.ok && res6.ok && res7.ok && res8.ok) {
          const [data1, data2, data3, data4, data5, data6, data7, data8] = await Promise.all([
            res1.json(), res2.json(), res3.json(), res4.json(),
            res5.json(), res6.json(), res7.json(), res8.json(),
          ]);
          const parsedData4 = data4.map(d => ({ ...d, total_fee: Number(d.total_fee) }));
          setFirstInfo(data1);
          setSecondInfo(data2);
          setThirdInfo(data3);
          setFourthInfo(parsedData4);
          setFifthInfo(data5);
          setDate(setAdmittedAndDischarged(data6[0], data6[1]));
          setSeventhInfo(data7);
          setEighthInfo(data8);
        }
      } catch (err) {
        console.error('Charts fetch error:', err);
      }
    }
    fetchData();
  }, []);

  const chartCardSx = {
    mb: 4, p: 2,
    border: '1px solid #e2e8f0', borderRadius: 2,
    backgroundColor: '#fff',
  };

  const SectionTitle = ({ children }) => (
    <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={2}>
      {children}
    </Typography>
  );

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <BarChart3 size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Analytics Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">Hospital performance charts and statistics</Typography>
        </Box>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Top 5 Tests By Count</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={firstInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="test_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Top 5 Tests By Revenue</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={secondInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="test_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="sum" fill="#059669" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Top 5 Medical Items By Revenue</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={thirdInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="drug_name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 2500]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="sum" fill="#d97706" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Top Doctors By Revenue</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fourthInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="DoctorName" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total_fee" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Gender Patient Distribution</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={fifthInfo} dataKey="s_count" nameKey="sex"
              cx="50%" cy="50%" outerRadius={110}
              label={renderCustomizedLabel}
            >
              {fifthInfo.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Patients by City</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={seventhInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="city_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Count" fill="#0891b2" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={chartCardSx}>
        <SectionTitle>Patients by Age Group</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eighthInfo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Count" fill="#dc2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export default Charts;
