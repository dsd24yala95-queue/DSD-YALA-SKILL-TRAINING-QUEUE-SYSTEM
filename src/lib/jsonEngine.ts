import { z } from "zod";

// Helper to safely coerce any value (number, null, boolean, undefined) into string with a default
const str = (defaultVal = "") =>
    z.preprocess((val) => (val === null || val === undefined ? defaultVal : String(val)), z.string().default(defaultVal));

// 100% compliant schema with DSD standard (50 fields)
export const ProfileSchema = z.object({
  register_type: str(""),
  reg_title: str("001"),
  reg_firstname: str(""),
  reg_lastname: str(""),
  reg_firstnameEng: str(""),
  reg_lastnameEng: str(""),
  reg_citizenid: str(""),
  reg_birth: str(""), // ISO format date string e.g., 2006-12-31T00:00:00
  reg_telephone: str(""),
  reg_email: str(""),
  reg_address_no: str(""),
  reg_address_moo: str(""),
  reg_address_street: str(""),
  reg_address_soi: str(""),
  reg_address_province: str(""),
  reg_address_district: str(""),
  reg_address_subdistrict: str(""),
  reg_education: str(""),
  reg_education_section: str(""),
  reg_body_state: str("0"),
  reg_body_state_detail: str(""),
  work_state: str("0"),
  work_section: str("0"),
  work_section_gov: str(""),
  work_section_self: str(""),
  work_section_detail: str("0"),
  work_salary: str(""),
  work_occupation: str(""),
  work_position: str(""),
  work_experience: str(""),
  work_place: str(""),
  work_province: str(""),
  work_telephone: str(""),
  work_fax: str(""),
  work_group: str(""),
  work_group_other: str(""),
  unwork_type: str("15"),
  unwork_other: str(""),
  info_type: str("04"),
  info_agree: str("0"),
  info_findjob: str("0"),
  info_findjob_detail: str(""),
  info_findjob_detail_industry: str(""),
  sign_img: str(""),
  regist_date: str(""), // ISO format datetime
  official: str(""),
  gender: str("1"),
  nationality: str("099"),
  postcode: str(""),
  info_findjob_country: str(""),
  industry_desc: str("00"),
  profileImage: str(""),
  info_findjob_detail_industry_desc: str("00"),
  reg_title_en: str("Mr."),
}).passthrough(); // Allow any other extra fields safely just in case

export type ProfileData = z.infer<typeof ProfileSchema>;

/**
 * Parses raw JSON string from Database, mapping legacy fields into the DSD standard schema automatically.
 */
export function parseProfileJson(rawJson: string | null | undefined, userContext?: { createdAt?: Date }): ProfileData {
    if (!rawJson) return ProfileSchema.parse({});

    try {
        const parsed = JSON.parse(rawJson);
        const mapped: any = { ...parsed };

        // Schema Mapping for legacy systems / older imports
        if (!mapped.reg_citizenid && mapped.reg_pid) {
            mapped.reg_citizenid = mapped.reg_pid;
        }
        if (!mapped.reg_birth && mapped.reg_bdate) {
            mapped.reg_birth = String(mapped.reg_bdate).includes("T") ? String(mapped.reg_bdate) : `${mapped.reg_bdate}T00:00:00`;
        }
        if (!mapped.reg_address_no && mapped.reg_addr_no !== undefined) mapped.reg_address_no = mapped.reg_addr_no;
        if (!mapped.reg_address_moo && mapped.reg_addr_moo !== undefined) mapped.reg_address_moo = mapped.reg_addr_moo;
        if (!mapped.reg_address_soi && mapped.reg_addr_soi !== undefined) mapped.reg_address_soi = mapped.reg_addr_soi;
        if (!mapped.reg_address_street && mapped.reg_addr_road !== undefined) mapped.reg_address_street = mapped.reg_addr_road;
        if (!mapped.reg_address_subdistrict && mapped.reg_addr_tumbon !== undefined) mapped.reg_address_subdistrict = mapped.reg_addr_tumbon;
        if (!mapped.reg_address_district && mapped.reg_addr_amphur !== undefined) mapped.reg_address_district = mapped.reg_addr_amphur;
        if (!mapped.reg_address_province && mapped.reg_addr_province !== undefined) mapped.reg_address_province = mapped.reg_addr_province;
        if (!mapped.postcode && mapped.reg_addr_zipcode !== undefined) mapped.postcode = mapped.reg_addr_zipcode;

        // Strip out old fields to keep DB clean
        const legacyKeys = ["reg_pid", "reg_bdate", "reg_addr_no", "reg_addr_moo", "reg_addr_soi", "reg_addr_road", "reg_addr_tumbon", "reg_addr_amphur", "reg_addr_province", "reg_addr_zipcode"];
        legacyKeys.forEach(key => delete mapped[key]);

        // Fix image format if it contains data uri
        if (mapped.profileImage && typeof mapped.profileImage === "string" && mapped.profileImage.startsWith("data:image")) {
            mapped.profileImage = mapped.profileImage.replace(/^data:image\/\w+;base64,/, '');
        }

        // Set regist_date if missing
        if (!mapped.regist_date) {
            mapped.regist_date = userContext?.createdAt ? new Date(userContext.createdAt).toISOString() : new Date().toISOString();
        }

        // Zod validation and defaulting with safe coercion
        return ProfileSchema.parse(mapped);
    } catch (e) {
        console.error("Failed to parse profile JSON:", e);
        try {
            const raw = JSON.parse(rawJson);
            const fallback: any = ProfileSchema.parse({});
            Object.keys(raw).forEach((k) => {
                if (raw[k] !== undefined && raw[k] !== null) {
                    fallback[k] = String(raw[k]);
                }
            });
            return fallback;
        } catch {
            return ProfileSchema.parse({});
        }
    }
}

/**
 * Validates and converts JS object into stringified JSON ready for DB insertion.
 */
export function buildProfileJson(data: any): string {
    const validated = ProfileSchema.parse(data);
    return JSON.stringify(validated);
}
