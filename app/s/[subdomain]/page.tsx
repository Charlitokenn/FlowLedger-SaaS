import PageHero from "@/components/ui/pageHero";

export default async function SubdomainPage({
    params
}: {
    params: { subdomain: string };
}) {
    const subdomain = await params

    return (
        <section>
            <PageHero
              type="greeting"
              subtitle={`Here you can see an overview of the business.`}
            />
        </section>
    );
}
