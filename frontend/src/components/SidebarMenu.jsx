import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from "lucide-react";
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { faHospitalUser } from '@fortawesome/free-solid-svg-icons';
import { faTable } from '@fortawesome/free-solid-svg-icons';
import { faKitMedical } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import "./SidebarMenu.css"
import { icon } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getVisibleMenuByRole } from "../utils/sidebarFilter";
import getUserRole from "../utils/auth";
import sidebarMenu from '../utils/sidebarMenu';
import API_BASE_URL from './apiConfig';


function Sidebar() {

  const role = getUserRole();
  const [visibleMenu,setVisibleMenu] = useState([]);
  useEffect(() => {
    setVisibleMenu(getVisibleMenuByRole(role));
  },[]);

    const [openIndex,setOpenIndex] = useState(null);
    const [subMenuIndex,setSubMenuIndex] = useState(null);
    const [tabularOpen, setTabularOpen] = useState(false);

    const toggleMenu = (index) => {
        if(index == openIndex){
            setOpenIndex(null);
        }else{
            setOpenIndex(index);
        }
    }

    const toggleSubmenu = (index) => {
      if(index !== null){
        setSubMenuIndex(index);
      }else{
        setSubMenuIndex(null);
      }
    }

    return(
        <div className="w-64 bg-gray-900 text-white h-screen overflow-y-auto p-4 sidebar-menu">
            {visibleMenu.map((menu,index) => (
                <div key={index}>
                    <div
                        onClick={() => {
                            toggleMenu(index)
                        }}
                        
                         className="flex justify-between items-center cursor-pointer py-2 px-3 hover:bg-gray-800 rounded-md font-semibold"
                    >
                        <span className='menu-title'>< FontAwesomeIcon icon={menu.icon} className='icon' />{menu.title}</span>
                        {openIndex === index ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                        {openIndex == index && 
                        <ul className='submenu-link'>
                            {menu.submenu.map((item, i) =>
                              item.submenu ? (
                                <li key={i}>
                                  <div 
                                    className="font-medium text-gray-300 cursor-pointer flex justify-between items-center"
                                    onClick={() => setTabularOpen(!tabularOpen)}
                                  >
                                    •  {item.label}
                                    {tabularOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                    {tabularOpen && 
                                      <ul className="pl-4">
                                        {item.submenu.map((subItem, j) => (
                                          <li key={j} className="py-1">
                                            <a href={subItem.link} className="hover:text-white">
                                              {subItem.label}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                }
                                </li>
                              ) : (
                                <li key={i}>
                                  <a href={item.link} className="your-link-styles">{item.label}</a>
                                </li>
                              )
                            )}


                        </ul>
                    }
                </div>    
            ))}
        </div>
    )
}

export default Sidebar;
