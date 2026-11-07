import { FormProvider, TemplateProvider, WorkflowProvider } from "./providers";
import Sidebar from "./components/Sidebar";

export const metadata = {
    title: "Admin Paneli",
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
    return (
        <FormProvider>
            <WorkflowProvider>
                <TemplateProvider>
                    <Sidebar>
                        {children}
                    </Sidebar>
                </TemplateProvider>
            </WorkflowProvider>
        </FormProvider>
    );
}