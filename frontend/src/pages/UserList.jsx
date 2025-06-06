import React, { useEffect, useState } from 'react';
import "./UserList.css"
import Navbar from '../components/SidebarMenu';
import API_BASE_URL from '../apiConfig';

function UserList() {

    const [users,setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fecthUsers = async () => {
            try{
                const res = await fetch(`${API_BASE_URL}/users`);
                const data = await res.json();
                console.log('Fetched data:', data);
                setUsers(Array.isArray(data) ? data : []);
            }catch(error){
                console.error('Error fetching users:', error);
            }
        };

        fecthUsers();
    }, []);

    const filteredUsers = searchQuery ? users.filter( user =>
        user.user_name.toLowerCase().includes(searchQuery.toLowerCase())
    ): users;

    return(
        <div className='ml-[20%]'>
            <div className='p-6 userlist'>
            <h1 className="text-2xl font-bold mb-4 block text-center">Browse All Users</h1>

            <div className='mb-4 block mx-auto flex justify-center mb-10 mt-10'>
                <input
                    type = "text"
                    placeholder='Search by username'
                    value={searchQuery}
                    className="p-3 w-72 shadow-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <table className="min-w-full border-collapse border border-gray-300 table rounded-lg">
                <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">ID</th>
                        <th className="border border-gray-300 px-4 py-2">Username</th>
                        <th className="border border-gray-300 px-4 py-2">User Type</th>
                        <th className="border border-gray-300 px-4 py-2">Created At</th>
                    </tr>
                </thead>
                <tbody>
                    { filteredUsers.length === 0 ?(
                        <tr>
                            <td colSpan="4" className="text-center py-4">No users found.</td>
                        </tr>
                    ) : (
                        filteredUsers.map(user =>(
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">{user.user_id}</td>
                                <td className="border border-gray-300 px-4 py-2">{user.user_name}</td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {user.user_type === 1 && "Admin"}
                                    {user.user_type === 2 && "Doctor"}
                                    {user.user_type === 3 && "Patient"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">{new Date(user.created_at).toLocaleString()}</td>
                            </tr>
                        ))
                    )
                    }
                </tbody>
            </table>
        </div>
        </div>
    )
}

export default UserList;