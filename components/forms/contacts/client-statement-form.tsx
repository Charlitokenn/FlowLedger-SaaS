import type React from "react"
import {Document, Page, Text, View, Image, StyleSheet, Font} from "@react-pdf/renderer"
import appConfig from "@/lib/app-config";
import {formatDate, thousandSeparator} from "@/lib/utils";

// Register fonts if needed
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
})

interface InvoiceItem {
    receivedAt: Date
    amount: number
    receiptNumber: string
    description: string
    rate: string
    subTotal: string
    totalFees: string
    totalSales: string
    statementBalance: string
}

interface ClientStatementProps {
    companyName: string
    companySubtitle: string
    statementTitle?: string
    logoUrl: string
    referenceNumber: string
    integrationName?: string
    billTo: {
        clientName: string
        projectName: string
        mobile: string
        region: string
        projectLocation: string
        plotSize: string
        pricePerSqm: string
        monthlyInstallment: number | string
        duration: string | number
        salesAgent: string
    }
    statementDetails: {
        contractValue: number | string
        totalPayments: string
        projectName: string
        accountRep: string
        accountRepEmail: string
        currentBalance: string
    }
    invoices: InvoiceItem[]
    totals: {
        total: string
    }
    footerNotes?: string
    poweredBy?: string
}

const brandColors = {
    primary: "#1e3a5f",
    secondary: "#4a6fa5",
    accent: "#f39c12",
}

const styles = StyleSheet.create({
    page: {
        backgroundColor: "#FFFFFF",
        padding: 30,
        fontFamily: "Helvetica",
        fontSize: 9,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        paddingBottom: 10,
    },
    rightHeaderSection: {
        flexDirection: "column",
        alignItems: "flex-end",   // align children to the right
        flex: 1,
    },
    infoRowRightTop: {
        flexDirection: "row",
        justifyContent: "flex-end", // push label/value to the right
        marginTop: 15,
    },
    infoRowRight: {
        flexDirection: "row",
        justifyContent: "flex-end", // push label/value to the right
    },
    infoHeaderLabel: {
        fontSize: 8,
        color: "#333",
        marginRight: 4,
        fontWeight: "bold",
        textAlign: "right",
    },
    infoHeaderValue: {
        fontSize: 8,
        color: "#333",
        width: "45%",
        textAlign: "right",
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: "contain",
        marginLeft: -30,
        marginTop: 8,
        borderRadius: 5,
    },
    companySection: {
        flexDirection: "column",
    },
    companyName: {
        fontSize: 16,
        fontWeight: "bold",
        color: brandColors.primary,
        marginBottom: 2,
    },
    companySubtitle: {
        fontSize: 8,
        color: "#666",
    },
    statementSection: {
        alignItems: "flex-end",
    },
    statementTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: brandColors.primary,
        marginBottom: 2,
    },
    statementSubtitle: {
        fontSize: 8,
        color: "#666",
    },
    infoSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        paddingVertical: 10,
    },
    infoColumnLeft: {
        width: "45%",
    },
    infoColumnRight: {
        width: "35%",
    },
    infoHeader: {
        backgroundColor: "#1e3a5f",
        color: "#FFFFFF",
        padding: 5,
        fontSize: 9,
        fontWeight: "bold",
        marginBottom: 5,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 8,
        color: "#333",
        width: "35%",
        fontWeight: "bold",
    },
    infoValue: {
        fontSize: 8,
        color: "#333",
        width: "65%",
    },
    infoValueRight: {
        fontSize: 8,
        color: "#333",
        width: "65%",
        textAlign: "right",
    },
    accountSection: {
        backgroundColor: "#f5f5f5",
        padding: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    accountItem: {
        flexDirection: "column",
        alignItems: "center",
    },
    accountLabel: {
        fontSize: 7,
        color: "#666",
        marginBottom: 2,
    },
    accountValue: {
        fontSize: 8,
        color: "#333",
        fontWeight: "bold",
    },
    table: {
        width: "100%",
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a5f",
        color: "#FFFFFF",
        padding: 5,
        fontSize: 7,
        fontWeight: "bold",
        borderBottom: 1,
        borderBottomColor: "#FFFFFF",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: 1,
        borderBottomColor: "#ddd",
        minHeight: 18,
        alignItems: "center",
    },
    tableRowAlt: {
        backgroundColor: "#f9f9f9",
    },
    colPaymentDate: {
        width: "8%",
        padding: 2,
        fontSize: 7,
    },
    colDetails: {
        width: "25%",
        padding: 2,
        fontSize: 7,
    },
    colReceiptNumber: {
        width: "7%",
        padding: 2,
        fontSize: 7,
    },
    colPaidAmount: {
        width: "12%",
        padding: 2,
        fontSize: 7,
        textAlign: "right",
    },
    colInstallmentDate: {
        width: "12%",
        padding: 2,
        fontSize: 7,
        textAlign: "right",
    },
    colInstallment: {
        width: "12%",
        padding: 2,
        fontSize: 7,
        textAlign: "right",
    },
    colInstallmentBalance: {
        width: "12%",
        padding: 2,
        fontSize: 7,
        textAlign: "right",
    },
    colContractBalance: {
        width: "12%",
        padding: 2,
        fontSize: 7,
        textAlign: "right",
    },
    subHeader: {
        backgroundColor: "#4a6fa5",
        color: "#FFFFFF",
        padding: 4,
        fontSize: 7,
        fontWeight: "bold",
    },
    totalsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        backgroundColor: "#1e3a5f",
        color: "#FFFFFF",
        padding: 8,
        marginTop: 5,
    },
    totalsLabel: {
        fontSize: 10,
        fontWeight: "bold",
        marginRight: 20,
    },
    totalsValue: {
        fontSize: 10,
        fontWeight: "bold",
    },
    footer: {
        marginTop: 15,
        paddingTop: 10,
        borderTop: 1,
        borderTopColor: "#ddd",
    },
    footerText: {
        fontSize: 7,
        color: "#666",
        textAlign: "center",
        marginBottom: 5,
    },
    footerBold: {
        fontSize: 7,
        color: "#333",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 3,
    },
    poweredBy: {
        fontSize: 6,
        color: "#999",
        textAlign: "center",
        marginTop: 10,
    },
    dividerLeft: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#A9A9A9",
        marginVertical: 1,
    },
    dividerRight: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#A9A9A9",
        marginTop: 10,
        marginBottom: 2,
    }
})

export const ClientStatementDocument: React.FC<ClientStatementProps> = ({
                                                                            companyName,
                                                                            companySubtitle,
                                                                            statementTitle,
                                                                            logoUrl,
                                                                            referenceNumber,
                                                                            billTo,
                                                                            statementDetails,
                                                                            invoices,
                                                                            totals,
                                                                            footerNotes
                                                                        }) => {
    return (
        <Document
            title="Client Statement"
            author={appConfig.appDetails.brand}
            subject="Client Account Statement"
            keywords=""
            creator={appConfig.appDetails.brand}
            producer={appConfig.appDetails.brand}
        >
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.companySection}>
                        <Text style={styles.companyName}>{companyName}</Text>
                        <Text style={styles.companySubtitle}>{companySubtitle}</Text>
                        <Image
                            src={logoUrl}
                            style={styles.logo}
                        />
                    </View>
                    <View style={styles.rightHeaderSection}>
                        <Text style={styles.statementTitle}>{statementTitle}</Text>

                        <View style={styles.infoRowRightTop}>
                            <Text style={styles.infoHeaderLabel}>Tarehe:</Text>
                            <Text style={styles.infoHeaderValue}>
                                {formatDate(new Date().toLocaleString())}
                            </Text>
                        </View>

                        <View style={styles.infoRowRight}>
                            <Text style={styles.infoHeaderLabel}>Kumb Namba:</Text>
                            <Text style={styles.infoHeaderValue}>{referenceNumber}</Text>
                        </View>
                    </View>
                </View>
                {/* Bill To and Statement Details Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoColumnLeft}>
                        <Text style={styles.infoHeader}>Mlipaji</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Jina:</Text>
                            <Text style={styles.infoValue}>{billTo.clientName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mradi:</Text>
                            <Text style={styles.infoValue}>{billTo.projectName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Namba ya Simu:</Text>
                            <Text style={styles.infoValue}>
                                {billTo.mobile}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mkoa:</Text>
                            <Text style={styles.infoValue}>{billTo.region}</Text>
                        </View>
                        <View style={styles.dividerLeft} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Eneo la Mradi:</Text>
                            <Text style={styles.infoValue}>{billTo.projectLocation}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Ukubwa wa Eneo:</Text>
                            <Text style={styles.infoValue}>{billTo.plotSize}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bei ya Mauzo:</Text>
                            <Text style={styles.infoValue}>{billTo.pricePerSqm}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Rejesho la Mwezi:</Text>
                            <Text style={styles.infoValue}>{billTo.monthlyInstallment}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Idadi ya Marejesho:</Text>
                            <Text style={styles.infoValue}>{billTo.duration}</Text>
                        </View>
                        <View style={styles.dividerLeft} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Afisa Mauzo:</Text>
                            <Text style={styles.infoValue}>{billTo.salesAgent}</Text>
                        </View>
                    </View>

                    <View style={styles.infoColumnRight}>
                        <Text style={styles.infoHeader}>Taarifa Fupi</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bei ya Kiwanja:</Text>
                            <Text style={styles.infoValueRight}>{statementDetails.contractValue}</Text>
                        </View>
                        <View style={styles.dividerRight} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Jumla ya Malipo:</Text>
                            <Text style={styles.infoValueRight}>{statementDetails.totalPayments}</Text>
                        </View>
                        <View style={styles.dividerRight} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Salio la Mkataba:</Text>
                            <Text style={styles.infoValueRight}>{statementDetails.currentBalance}</Text>
                        </View>
                    </View>
                </View>

                {/* Account Details Section */}
                <View style={styles.accountSection}>
                    <View style={styles.accountItem}>
                        <Text style={styles.accountValue}>Malipo Yaliyofanyika</Text>
                    </View>

                    <View style={styles.accountItem}>
                        <Text style={styles.accountValue}>Orodha Marejesho ya Mkataba</Text>
                    </View>
                </View>

                {/* Table Section */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colPaymentDate}>Tarehe ya Malipo</Text>
                        <Text style={styles.colDetails}>Taarifa ya Muamala</Text>
                        <Text style={styles.colReceiptNumber}>Risiti Namba</Text>
                        <Text style={styles.colPaidAmount}>Kiasi Kilicholipwa</Text>
                        <Text style={styles.colInstallmentDate}>Tarehe ya Rejesho</Text>
                        <Text style={styles.colInstallment}>Kiasi cha Rejesho</Text>
                        <Text style={styles.colInstallmentBalance}>Salio la Rejesho</Text>
                        <Text style={styles.colContractBalance}>Salio la Mkataba</Text>
                    </View>

                    {/* Table Rows */}
                    {invoices.map((invoice, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <Text style={styles.colPaymentDate}>{formatDate(invoice.receivedAt.toLocaleDateString())}</Text>
                            <Text style={styles.colDetails}>Malipo ya rejesho</Text>
                            <Text style={styles.colReceiptNumber}>{invoice.receiptNumber}</Text>
                            <Text style={styles.colPaidAmount}>{thousandSeparator(invoice.amount)}</Text>
                            <Text style={styles.colInstallmentDate}>{invoice.rate}</Text>
                            <Text style={styles.colInstallment}>{invoice.subTotal}</Text>
                            <Text style={styles.colInstallmentBalance}>{invoice.totalFees}</Text>
                            <Text style={styles.colContractBalance}>{invoice.totalSales}</Text>
                        </View>
                    ))}

                    {/* Totals Row */}
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Total:</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                        <Text style={styles.totalsValue}>{statementDetails.totalPayments}</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                        <Text style={styles.totalsValue}>{totals.total}</Text>
                    </View>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{footerNotes}</Text>
                    <Text style={styles.footerBold}>Make all checks payable to {companyName}</Text>
                    <Text style={styles.footerText}>If you have any questions concerning this statement, please contact us on [officalMobile]</Text>
                    <Text style={styles.footerText}>[address]</Text>
                    <Text style={styles.footerText}>[Contact Name], [Phone], [Email]</Text>
                </View>
            </Page>
        </Document>
    )
}