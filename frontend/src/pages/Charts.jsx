import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/SidebarMenu';

function Charts() {
  const [firstInfo, setFirstInfo] = useState([]);
  const [secondInfo, setSecondInfo] = useState([]);
  const [thirdInfo, setThirdInfo] = useState([]);
  const [fourthInfo, setFourthInfo] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res1 = await fetch('http://localhost:3000/firstChart');
        const res2 = await fetch('http://localhost:3000/secondChart');
        const res3 = await fetch('http://localhost:3000/thirdChart');
        const res4 = await fetch('http://localhost:3000/fourthChart');

        if (res1.ok && res2.ok && res3.ok && res4.ok) {
          const data1 = await res1.json();
          const data2 = await res2.json();
          const data3 = await res3.json();
          const data4 = await res4.json();

          // Parse total_fee to number
          const parsedData4 = data4.map((d) => ({
            ...d,
            total_fee: Number(d.total_fee),
          }));

          setFirstInfo(data1);
          setSecondInfo(data2);
          setThirdInfo(data3);
          setFourthInfo(parsedData4);
        } else {
          console.log('One or more responses are not OK');
        }
      } catch (err) {
        console.error('Error is ', err);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className='charts ml-[20%]'>
      <div>
        <h2 className="text-xl font-bold mb-4">Top 5 Tests By Count</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={firstInfo}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            key="firstChart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test_name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Top 5 Tests By Revenue</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={secondInfo}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            key="secondChart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test_name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sum" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Top 5 Medical Items By Revenue</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={thirdInfo}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            key="thirdChart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="drug_name" />
            <YAxis domain={[0, 2500]} />
            <Tooltip />
            <Bar dataKey="sum" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Top Doctors By Revenue</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={fourthInfo}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            key="fourthChart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="DoctorName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_fee" fill="#ff7300" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}

export default Charts;
