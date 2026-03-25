import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Loans } from './pages/Loans';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeProvider';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col relative z-10 transition-colors duration-500">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/loans" element={<Loans />} />
            </Routes>
          </main>
          <footer className="mt-8 text-center text-gray-500 text-sm py-8 animate-enter delay-200">
            <p>A premium and modern loan calculator tailored for smart financial planning.</p>
          </footer>
        </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
