#!/usr/bin/env python3

"""Generate tariff snapshots and CHED-P fish commodity data."""

import csv
import io
import json
from collections import defaultdict
from pathlib import Path
from urllib.request import urlopen


AS_OF_DATE = "2026-09-09"
FISH_EXPORT_SERVICE_COMMIT = "b6acc2b5fc15f3bb14a320f253e55d773b48a0e3"
FISH_EXPORT_SERVICE_URL = (
    "https://raw.githubusercontent.com/DEFRA/"
    "eutd-mmo-fes-batch-data-process/"
    f"{FISH_EXPORT_SERVICE_COMMIT}/data/commodity_code.txt"
)
SECTION_ONE_URL = (
    "https://www.trade-tariff.service.gov.uk/uk/api/v2/"
    f"goods_nomenclatures/section/1.csv?as_of={AS_OF_DATE}"
)
SECTION_FOUR_CHAPTER_SIXTEEN_URL = (
    "https://www.trade-tariff.service.gov.uk/uk/api/v2/"
    f"goods_nomenclatures/chapter/16.csv?as_of={AS_OF_DATE}"
)

DATA_DIRECTORY = Path(__file__).resolve().parents[1] / "data"
SECTION_ONE_OUTPUT = DATA_DIRECTORY / "section-1-commodities.js"
SECTION_FOUR_CHAPTER_SIXTEEN_OUTPUT = (
    DATA_DIRECTORY / "section-4-chapter-16-commodities.js"
)
CHED_P_FISH_OUTPUT = DATA_DIRECTORY / "ched-p-fish-commodities.js"

# Corrections are limited to source codes that have an unambiguous successor in
# the tariff snapshot used by this prototype.
SOURCE_CODE_CORRECTIONS = {
    "03038190": "03038180",
    "03048819": "03048829",
    "03039200": "030392",
    "160559000": "16055900",
}

PRESERVATION_LABELS = {
    "ALI": "Alive",
    "BOI": "Boiled",
    "FRE": "Fresh",
    "FRO": "Frozen",
    "OTH": "Other states",
    "SAL": "Salted",
    "SMO": "Smoked",
}

PRESENTATION_LABELS = {
    "CLA": "Claws only",
    "FIL": "Filleted",
    "FIN": "Fins only",
    "FIS": "Filleted and skinned",
    "FSB": "Filleted with skin and bones",
    "FSP": "Filleted and skinned with pinbone on",
    "GHT": "Gutted, headed and tailed",
    "GUH": "Gutted and headed",
    "GUL": "Gutted, without removing liver parts",
    "GUS": "Gutted, headed and skinned",
    "GUT": "Gutted",
    "HEA": "Headed",
    "JAP": "Japanese cut",
    "OTH": "Other presentations",
    "ROE": "Roe",
    "SGH": "Salted, gutted and headed",
    "SGT": "Salted and gutted",
    "TAL": "Tails only",
    "TUB": "Tube only",
    "WHL": "Whole",
    "WNG": "Wings only",
}


def download_text(url):
    with urlopen(url) as response:
        return response.read().decode("utf-8-sig")


def read_tariff_rows(url):
    rows = csv.DictReader(io.StringIO(download_text(url)))
    return [
        {
            "description": row["Description"],
            "commodityCode": row["Goods Nomenclature Item ID"],
        }
        for row in rows
        if row["Declarable"].lower() == "true"
    ]


def normalized_preservation(row):
    source_code = row["preservationState"].strip()
    code = source_code or (
        "FRE" if row["preservationDescr"].strip().lower() == "fresh" else ""
    )
    if code not in PRESERVATION_LABELS:
        raise ValueError(f"Unknown preservation code: {code!r}")

    preservation = {
        "code": code,
        "label": PRESERVATION_LABELS[code],
    }
    if source_code != code:
        preservation["sourceCode"] = source_code
    return preservation


def normalized_presentation(row):
    code = row["presentationState"].strip()
    if code not in PRESENTATION_LABELS:
        raise ValueError(f"Unknown presentation code: {code!r}")
    return {
        "code": code,
        "label": PRESENTATION_LABELS[code],
    }


def build_fish_groups(fish_rows, tariff_rows):
    tariff_codes = [row["commodityCode"] for row in tariff_rows]
    groups = {}
    species_by_group = defaultdict(dict)

    for row in fish_rows:
        source_code = row["commodityCode"].strip()
        code = SOURCE_CODE_CORRECTIONS.get(source_code, source_code)
        if not code.startswith(("03", "16")):
            continue

        description = row["commodityCodeDescr"].strip()
        group = groups.setdefault(
            code,
            {
                "id": code,
                "name": description,
                "code": code,
                "description": description,
                "tariffCommodityCodes": [
                    tariff_code
                    for tariff_code in tariff_codes
                    if tariff_code.startswith(code)
                ],
                "species": [],
                "mapping": {
                    "method": (
                        "source-correction-and-tariff-prefix"
                        if source_code != code
                        else "tariff-prefix"
                    ),
                    "status": "matched",
                    "sourceCodes": [],
                },
            },
        )

        if group["description"] != description:
            raise ValueError(f"Conflicting descriptions for commodity code {code}")
        if not group["tariffCommodityCodes"]:
            raise ValueError(f"No current tariff descendants found for {source_code}")
        if source_code not in group["mapping"]["sourceCodes"]:
            group["mapping"]["sourceCodes"].append(source_code)

        fao_code = row["faoCode"].strip()
        species_id = f"{code}:{fao_code}"
        species = species_by_group[code].setdefault(
            species_id,
            {
                "id": species_id,
                "faoCode": fao_code,
                "commonName": row["faoName"].strip(),
                "label": row["scientificName"].strip(),
                "scientificName": row["scientificName"].strip(),
                "productOptions": [],
            },
        )

        if (
            species["commonName"] != row["faoName"].strip()
            or species["scientificName"] != row["scientificName"].strip()
        ):
            raise ValueError(f"Conflicting names for FAO species {fao_code}")

        product_option = {
            "preservation": normalized_preservation(row),
            "presentation": normalized_presentation(row),
        }
        if product_option not in species["productOptions"]:
            species["productOptions"].append(product_option)

    for code, group in groups.items():
        group["tariffCommodityCodes"].sort()
        group["mapping"]["sourceCodes"].sort()
        group["species"] = sorted(
            species_by_group[code].values(),
            key=lambda species: (
                species["commonName"].lower(),
                species["scientificName"].lower(),
                species["faoCode"],
            ),
        )
        for species in group["species"]:
            species["productOptions"].sort(
                key=lambda option: (
                    option["preservation"]["label"],
                    option["presentation"]["label"],
                )
            )

    return sorted(groups.values(), key=lambda group: group["code"])


def write_javascript(path, source_urls, records, ensure_ascii=True):
    source_lines = "\n".join(f"// Source: {url}" for url in source_urls)
    content = (
        f"// Generated by app/part1/v3/scripts/{Path(__file__).name}\n"
        f"{source_lines}\n"
        f"module.exports = {json.dumps(records, indent=2, ensure_ascii=ensure_ascii)}\n"
    )
    path.write_text(content, encoding="utf-8")


def main():
    section_one_tariff = read_tariff_rows(SECTION_ONE_URL)
    section_four_chapter_sixteen_tariff = read_tariff_rows(
        SECTION_FOUR_CHAPTER_SIXTEEN_URL
    )
    fish_rows = list(
        csv.DictReader(
            io.StringIO(download_text(FISH_EXPORT_SERVICE_URL)),
            delimiter="\t",
        )
    )
    fish_groups = build_fish_groups(
        fish_rows,
        section_one_tariff + section_four_chapter_sixteen_tariff,
    )

    write_javascript(
        SECTION_ONE_OUTPUT,
        [SECTION_ONE_URL],
        section_one_tariff,
        ensure_ascii=False,
    )
    write_javascript(
        SECTION_FOUR_CHAPTER_SIXTEEN_OUTPUT,
        [SECTION_FOUR_CHAPTER_SIXTEEN_URL],
        section_four_chapter_sixteen_tariff,
    )
    write_javascript(
        CHED_P_FISH_OUTPUT,
        [
            FISH_EXPORT_SERVICE_URL,
            SECTION_ONE_URL,
            SECTION_FOUR_CHAPTER_SIXTEEN_URL,
        ],
        fish_groups,
    )

    species_count = sum(len(group["species"]) for group in fish_groups)
    option_count = sum(
        len(species["productOptions"])
        for group in fish_groups
        for species in group["species"]
    )
    print(
        f"Generated {len(section_one_tariff)} Section 1 tariff records, "
        f"{len(section_four_chapter_sixteen_tariff)} Chapter 16 tariff records, "
        f"{len(fish_groups)} commodity groups, "
        f"{species_count} commodity/species selections and "
        f"{option_count} product options."
    )


if __name__ == "__main__":
    main()
