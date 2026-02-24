// STEP TEST: Add providers one by one to find the freeze

import React from "react";

// Uncomment ONE at a time to test:

// TEST 1: Just React import (current - works)
export default function App() {
  return (
    <div style={{ padding: 50, textAlign: "center", fontFamily: "Arial", background: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>🐝 STEP 1: Pure React</h1>
      <p>If this works, add ThemeProvider...</p>
    </div>
  );
}

// TEST 2: Add ThemeProvider
// import { ThemeProvider } from "@/contexts/ThemeContext";
// export default function App() {
//   return (
//     <ThemeProvider>
//       <div style={{ padding: 50, textAlign: "center" }}>
//         <h1>🐝 STEP 2: ThemeProvider</h1>
//       </div>
//     </ThemeProvider>
//   );
// }

// TEST 3: Add NotificationProvider  
// import { ThemeProvider } from "@/contexts/ThemeContext";
// import { NotificationProvider } from "@/contexts/NotificationContext";
// export default function App() {
//   return (
//     <ThemeProvider>
//       <NotificationProvider>
//         <div style={{ padding: 50, textAlign: "center" }}>
//           <h1>🐝 STEP 3: NotificationProvider</h1>
//         </div>
//       </NotificationProvider>
//     </ThemeProvider>
//   );
// }

// TEST 4: Add AuthProvider (MOST LIKELY CULPRIT!)
// import { ThemeProvider } from "@/contexts/ThemeContext";
// import { NotificationProvider } from "@/contexts/NotificationContext";
// import { AuthProvider } from "@/contexts/AuthContext";
// export default function App() {
//   return (
//     <ThemeProvider>
//       <NotificationProvider>
//         <AuthProvider>
//           <div style={{ padding: 50, textAlign: "center" }}>
//             <h1>🐝 STEP 4: AuthProvider</h1>
//           </div>
//         </AuthProvider>
//       </NotificationProvider>
//     </ThemeProvider>
//   );
// }
