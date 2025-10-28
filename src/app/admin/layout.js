import Sidebar from "./components/Sidebar";

export const metadata = {
    title: "Forms | Admin",
};

export default function AdminLayout({ children }) {
    return (
        <Sidebar>
            {children}
        </Sidebar>
    );
}