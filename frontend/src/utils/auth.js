function getUserRole() {
    const token = localStorage.getItem('token');
    if(!token) return null;

    try{
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.type;
    }catch(err){
        console.error("Error is ",err);
        return null;
    }
}

export default getUserRole;