// libs/utils/transmission.ts

export const TRANSMISSIONS: { value: number; label: string }[] = [
    { value: 1, label: 'Manual' },
    { value: 2, label: 'Automatic' },
    { value: 3, label: 'CVT' },
    { value: 4, label: 'Robot (DCT)' },
    { value: 5, label: 'Tiptronic' },
];

export const transmissionLabel = (v: any): string => {
    const n = Number(v);
    const found = TRANSMISSIONS.find((x) => x.value === n);
    return found ? found.label : 'N/A';
};
