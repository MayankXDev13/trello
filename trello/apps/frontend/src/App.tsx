import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { Routes, Route, BrowserRouter } from "react-router";
import Board from "./components/Board";

export function App() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <BrowserRouter>
        <Routes>
          <Route path="/board/:boardId" element={<Board />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
