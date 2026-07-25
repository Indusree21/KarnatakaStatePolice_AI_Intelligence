import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import StatCard from "../../components/dashboard/StatCard";

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <div className="p-6">
          <WelcomeBanner />

          <div className="grid grid-cols-4 gap-5 mt-6">
            <StatCard title="Active Cases" value="245" />
            <StatCard title="Today's FIRs" value="18" />
            <StatCard title="Pending Reports" value="41" />
            <StatCard title="Solved Cases" value="156" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;