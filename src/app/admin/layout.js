import { FormProvider } from "./providers";
import Sidebar from "./components/Sidebar";

export const metadata = {
    title: "Admin Paneli",
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
    return (
        <FormProvider>
            <Sidebar>
                {children}
            </Sidebar>
        </FormProvider>
    );
}