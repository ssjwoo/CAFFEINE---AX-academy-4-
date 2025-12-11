// 04_app_front/src/App.jsx

import { useEffect, useState } from "react";
import { apiClient } from "./api/client";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiClient
      .get("/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("API error:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>사용자 리스트 (DUMMY DATA!!)</h1>
      {users.map((u) => (
        <div key={u.id}>
          {u.id}. {u.name} ({u.email})
        </div>
      ))}
    </div>
  );
}

export default App;
