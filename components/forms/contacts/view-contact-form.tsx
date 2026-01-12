"use client"

import * as React from "react"
import VerticalTabs, { VerticalTabItem } from "@/components/reusable components/reusable-vertical-tabs"
import PageHero from "@/components/ui/pageHero"
import {FileText, HouseIcon } from "lucide-react"
import {formatInternationalWithSpaces, getInitials, thousandSeparator, toProperCase} from "@/lib/utils"
import { ClientStatementDocument } from "./client-statement"
import { PDFViewer } from "@react-pdf/renderer"
import ClientContacts from "@/types/globals"
import { Button } from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"

//TODO - Add a message/tooltip to be displayed whenever there is no internet connectivity

const ViewContactForm = ({ contact,extra }: { contact: ClientContact, extra: { logo:string, tenantName: string } }) => {
    const [selectedPlotId, setSelectedPlotId] = React.useState<string>(
        contact?.plots?.[0]?.id ?? ""
    );
    const selectedPlot = contact?.plots?.find(plot => plot.id === selectedPlotId);

    const tabsData: VerticalTabItem[] = React.useMemo(() => {
        const plotsCount = contact?.plots?.length ?? 0
        const hasPlots = plotsCount > 0;
        const isClient = contact?.contactType === "CLIENT";

        const plotSize = selectedPlot?.surveyedSize ? thousandSeparator(Number(selectedPlot?.surveyedSize)) : thousandSeparator(Number(selectedPlot?.unsurveyedSize)) ?? ""

        const duration = (() => {
            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];
            return contract?.termMonths ?? 0;
        })();

        const contractValue = (() => {
            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];
            return contract?.totalContractValue ?? 0;
        })();

        const pricePerSqm = plotSize ? (Number(contractValue) / Number(plotSize.replace(/,/g, ''))) : 0

        const totalPayments = (() => {
            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];
            return contract?.payments
                ?.filter(payment => payment.direction === "IN")
                .reduce((sum, payment) => sum + parseFloat(payment.amount), 0) ?? 0;
        })();

        const payments = (()=> {
            if (selectedPlot?.activeContract && selectedPlot?.contracts?.length > 0) {
                return [...(selectedPlot.activeContract.payments ?? []), ...(selectedPlot.contracts[0].payments ?? [])];
            }

            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];
            return contract?.payments?.filter(payment => payment.direction === "IN")
        })();

        const installments = (() => {
            if (selectedPlot?.activeContract && selectedPlot?.contracts?.length > 0) {
                return [...(selectedPlot.activeContract.installments ?? []), ...(selectedPlot.contracts[0].installments ?? [])];
            }
            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];
            return contract?.installments;
        })();

        const invoices = { payments: payments, installments: installments }

        //Calculate installment basing on purchase plan
        const installment = (() => {
            // Try activeContract first, then fall back to the first contract in contracts array
            const contract = selectedPlot?.activeContract ?? selectedPlot?.contracts?.[0];

            if (!contract) return 0;

            const total = Number(contract.totalContractValue);
            const months = contract.termMonths;

            if (contract.purchasePlan === "FLAT_RATE") {
                return total / months;
            }

            if (contract.downpaymentPercent) {
                return ((1 - contract.downpaymentPercent) * total) / (months - 1);
            }

            return 0;
        })();

        const tabs = [
            {
                value: "tab-1",
                label: "Overview",
                icon: HouseIcon,
                content: (
                    <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
                        <PageHero
                            title={contact.fullName}
                            subtitle={`Purchased total of ${plotsCount} plot${plotsCount === 1 ? "" : "s"}`}
                            type="hero"
                        />
                    </div>
                ),
            },
        ]

        if (hasPlots && isClient) {
            tabs.push(
                {
                    value: "tab-2",
                    label: "Client Statement",
                    icon: FileText,
                    content: (
                        <div className="rounded border-l-2 border-dashed min-h-[490px] mr-3 pl-6 py-1 mx-3">
                            <div className="flex justify-between mb-2">
                                <Select value={selectedPlotId} onValueChange={setSelectedPlotId}>
                                    <SelectTrigger className="flex flex-">
                                        <SelectValue placeholder="Select Plot/Contract" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contact.plots.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                <span>{item.project.projectName}</span> - Plot No.<span>{item.plotNumber}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="">Confirmation Letter</Button>
                            </div>
                            <PDFViewer width="100%" height={480} showToolbar={false} className="rounded-lg">
                                <ClientStatementDocument
                                    companyName={extra.tenantName}
                                    companySubtitle="We help you invest"
                                    statementTitle="Taarifa ya Malipo"
                                    logoUrl={extra.logo}
                                    referenceNumber={`${getInitials(extra.tenantName)}/${selectedPlot?.project?.projectName.replaceAll(' ', '') ?? ""}/${getInitials(contact.fullName)}/${new Date().toISOString().split('T')[0].replace(/-/g, '')}`}
                                    billTo={{
                                        clientName: contact.fullName,
                                        projectName: selectedPlot?.project.projectName ?? "",
                                        mobile: formatInternationalWithSpaces(contact.mobileNumber) ?? "",
                                        region: `${contact.region ?? ""} ${contact.street ?? ''} ${contact.ward ?? ''}`.trim(),
                                        projectLocation: `${selectedPlot?.project.projectName} - Plot No. ${selectedPlot?.plotNumber}`,
                                        plotSize: `Sqm ${plotSize}`,
                                        pricePerSqm: `Tshs. ${thousandSeparator(pricePerSqm)} /Sqm`,
                                        monthlyInstallment: `Tshs. ${thousandSeparator(installment)}`,
                                        duration: `${duration}`,
                                        salesAgent: "John doe",
                                    }}
                                    statementDetails={{
                                        contractValue: `Tshs. ${thousandSeparator(Number(contractValue))}`,
                                        totalPayments: `Tshs. ${thousandSeparator(totalPayments)}`,
                                        projectName: selectedPlot?.project?.projectName ?? "",
                                        accountRep: "",
                                        accountRepEmail: "",
                                        currentBalance: `${Number(contractValue)-totalPayments < 0 ? "Tshs. 0" : `Tshs. ${thousandSeparator(Number(contractValue) - totalPayments)}`}`,
                                    }}
                                    invoices={invoices}
                                    totals={{ total: selectedPlot?.activeContract?.totalContractValue ?? "" }}
                                    footerNotes={Number(Number(contractValue)-totalPayments) > Number(contractValue)
                                        ? "Umekamilisha kulipa malipo yote. Asante kwa kuwa mteja wetu wa thamani."
                                        : `Salio la mkataba wako ni Tshs. ${thousandSeparator(Number(contractValue)-totalPayments)}. Tafadhali fanya malipo kulipa kiasi kilichobakia kabla ya mkataba kuisha.`
                                    }
                                />
                            </PDFViewer>
                        </div>
                    ),
                }
            )
        }

        return tabs

    }, [contact, selectedPlotId, selectedPlot])

    return (
        <div className="mt-8 ml-2">
            <VerticalTabs tabs={tabsData} defaultValue="tab-1" />
        </div>
    )
}

export default ViewContactForm