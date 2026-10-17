<?php

use App\Modules\Shipping\Models\District;
use App\Modules\Shipping\Models\ShippingZone;
use App\Modules\Shipping\Models\Upazila;
use App\Modules\Shipping\Services\ShippingCalculatorService;
use Database\Seeders\BangladeshGeographicSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(BangladeshGeographicSeeder::class);
    $this->service = app(ShippingCalculatorService::class);
});

test('seeds exactly 64 districts and all upazilas', function () {
    expect(District::count())->toBe(64)
        ->and(Upazila::count())->toBeGreaterThanOrEqual(490);
});

test('seeder is idempotent and repeatable without duplicating geographic records', function () {
    $initialDistricts = District::count();
    $initialUpazilas = Upazila::count();
    $initialZones = ShippingZone::count();

    // Re-run seeder
    $this->seed(BangladeshGeographicSeeder::class);

    expect(District::count())->toBe($initialDistricts)
        ->and(Upazila::count())->toBe($initialUpazilas)
        ->and(ShippingZone::count())->toBe($initialZones);
});

test('seeds the three configurable shipping zones with standard rates and delivery times', function () {
    $insideDhaka = ShippingZone::where('code', 'inside_dhaka')->first();
    $subDhaka = ShippingZone::where('code', 'sub_dhaka')->first();
    $outsideDhaka = ShippingZone::where('code', 'outside_dhaka')->first();

    expect($insideDhaka)->not->toBeNull()
        ->and((float) $insideDhaka->rate)->toBe(70.00)
        ->and($insideDhaka->delivery_time)->toBe('24-48 hours')
        ->and($insideDhaka->is_default)->toBeFalse();

    expect($subDhaka)->not->toBeNull()
        ->and((float) $subDhaka->rate)->toBe(100.00)
        ->and($subDhaka->delivery_time)->toBe('24-48 hours')
        ->and($subDhaka->is_default)->toBeFalse();

    expect($outsideDhaka)->not->toBeNull()
        ->and((float) $outsideDhaka->rate)->toBe(130.00)
        ->and($outsideDhaka->delivery_time)->toBe('48-72 hours')
        ->and($outsideDhaka->is_default)->toBeTrue();
});

test('district and upazila zone relationships are accurately mapped', function () {
    $dhaka = District::where('name', 'Dhaka')->first();
    $gazipur = District::where('name', 'Gazipur')->first();
    $narayanganj = District::where('name', 'Narayanganj')->first();
    $chattogram = District::where('name', 'Chattogram')->first();

    expect($dhaka->shippingZone->code)->toBe('inside_dhaka');
    expect($gazipur->shippingZone->code)->toBe('sub_dhaka');
    expect($narayanganj->shippingZone->code)->toBe('sub_dhaka');
    expect($chattogram->shippingZone->code)->toBe('outside_dhaka');

    // Sub-Dhaka upazila overrides inside Dhaka district
    $savar = Upazila::where('district_id', $dhaka->id)->where('name', 'Savar')->first();
    $keraniganj = Upazila::where('district_id', $dhaka->id)->where('name', 'Keraniganj')->first();
    $dhamrai = Upazila::where('district_id', $dhaka->id)->where('name', 'Dhamrai')->first();

    expect($savar)->not->toBeNull()
        ->and($savar->shippingZone->code)->toBe('sub_dhaka');

    expect($keraniganj)->not->toBeNull()
        ->and($keraniganj->shippingZone->code)->toBe('sub_dhaka');

    // Default upazilas in Dhaka inherit the district zone
    expect($dhamrai)->not->toBeNull()
        ->and($dhamrai->shipping_zone_id)->toBeNull();
});

test('ShippingCalculatorService resolves Inside Dhaka rate for Dhaka district', function () {
    $result = $this->service->calculate('Dhaka');

    expect($result->zoneCode)->toBe('inside_dhaka')
        ->and($result->shippingFee)->toBe(70.00)
        ->and($result->formattedFee())->toBe('৳70.00')
        ->and($result->deliveryTime)->toBe('24-48 hours');
});

test('ShippingCalculatorService resolves Sub-Dhaka rate for Savar and Keraniganj upazilas', function () {
    $savarResult = $this->service->calculate('Dhaka', 'Savar');
    expect($savarResult->zoneCode)->toBe('sub_dhaka')
        ->and($savarResult->shippingFee)->toBe(100.00)
        ->and($savarResult->formattedFee())->toBe('৳100.00');

    $keraniganjResult = $this->service->calculate('Dhaka', 'Keraniganj');
    expect($keraniganjResult->zoneCode)->toBe('sub_dhaka')
        ->and($keraniganjResult->shippingFee)->toBe(100.00);
});

test('ShippingCalculatorService resolves Sub-Dhaka rate for Gazipur and Narayanganj districts', function () {
    $gazipurResult = $this->service->calculate('Gazipur');
    expect($gazipurResult->zoneCode)->toBe('sub_dhaka')
        ->and($gazipurResult->shippingFee)->toBe(100.00);

    $narayanganjResult = $this->service->calculate('Narayanganj');
    expect($narayanganjResult->zoneCode)->toBe('sub_dhaka')
        ->and($narayanganjResult->shippingFee)->toBe(100.00);
});

test('ShippingCalculatorService resolves Outside Dhaka rate for other 61 districts', function () {
    $districts = ['Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Coxsbazar', 'Bogura'];

    foreach ($districts as $d) {
        $result = $this->service->calculate($d);
        expect($result->zoneCode)->toBe('outside_dhaka')
            ->and($result->shippingFee)->toBe(130.00)
            ->and($result->formattedFee())->toBe('৳130.00')
            ->and($result->deliveryTime)->toBe('48-72 hours');
    }
});

test('ShippingCalculatorService resolves by Bengali names and case-insensitive strings', function () {
    $dhakaBn = $this->service->calculate('ঢাকা');
    expect($dhakaBn->zoneCode)->toBe('inside_dhaka')
        ->and($dhakaBn->shippingFee)->toBe(70.00);

    $ctgBn = $this->service->calculate('চট্টগ্রাম');
    expect($ctgBn->zoneCode)->toBe('outside_dhaka')
        ->and($ctgBn->shippingFee)->toBe(130.00);

    $lowerCase = $this->service->calculate('dhaka');
    expect($lowerCase->zoneCode)->toBe('inside_dhaka');
});

test('ShippingCalculatorService reflects customizable rates updated dynamically in database', function () {
    // Update Inside Dhaka rate to 80.00 and Outside Dhaka rate to 150.00
    $this->service->updateZoneRate('inside_dhaka', 80.00);
    $this->service->updateZoneRate('outside_dhaka', 150.00);

    $dhakaResult = $this->service->calculate('Dhaka');
    expect($dhakaResult->shippingFee)->toBe(80.00)
        ->and($dhakaResult->formattedFee())->toBe('৳80.00');

    $sylhetResult = $this->service->calculate('Sylhet');
    expect($sylhetResult->shippingFee)->toBe(150.00)
        ->and($sylhetResult->formattedFee())->toBe('৳150.00');
});

test('ShippingCalculationResult serializes to complete array for API/Inertia consumers', function () {
    $result = $this->service->calculate('Dhaka', 'Savar');
    $array = $result->toArray();

    expect($array)->toHaveKeys([
        'zone_id',
        'zone_code',
        'zone_name',
        'shipping_fee',
        'formatted_fee',
        'delivery_time',
        'district_name',
        'upazila_name',
    ])
        ->and($array['zone_code'])->toBe('sub_dhaka')
        ->and($array['shipping_fee'])->toBe(100.00)
        ->and($array['district_name'])->toBe('Dhaka')
        ->and($array['upazila_name'])->toBe('Savar');
});
