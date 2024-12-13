// purchaseVerify.service.ts

export const verifyGooglePurchase = async (purchaseToken: string): Promise<boolean> => {
    // For now, just log and return true
    console.log('Verifying Google purchase token:', purchaseToken)
    return true
}