const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Simplified parseProfileJson for node script (no dependencies on next aliases)
const ProfileSchema = z.object({
  register_type: z.string().optional().default(""),
  reg_title: z.string().optional().default("001"),
  reg_firstname: z.string().optional().default(""),
  reg_lastname: z.string().optional().default(""),
  reg_firstnameEng: z.string().optional().default(""),
  reg_lastnameEng: z.string().optional().default(""),
  reg_citizenid: z.string().length(13, "Citizen ID must be 13 characters").optional().default(""),
  reg_birth: z.string().optional().default(""),
  reg_telephone: z.string().optional().default(""),
  reg_email: z.string().optional().default(""),
  reg_address_no: z.string().optional().default(""),
  reg_address_moo: z.string().optional().default(""),
  reg_address_street: z.string().optional().default(""),
  reg_address_soi: z.string().optional().default(""),
  reg_address_province: z.string().optional().default(""),
  reg_address_district: z.string().optional().default(""),
  reg_address_subdistrict: z.string().optional().default(""),
  reg_education: z.string().optional().default(""),
  reg_education_section: z.string().optional().default(""),
  reg_body_state: z.string().optional().default("0"),
  reg_body_state_detail: z.string().optional().default(""),
  work_state: z.string().optional().default("0"),
  work_section: z.string().optional().default("0"),
  work_section_detail: z.string().optional().default("0"),
  work_salary: z.string().optional().default(""),
  work_occupation: z.string().optional().default(""),
  work_position: z.string().optional().default(""),
  work_experience: z.string().optional().default(""),
  work_place: z.string().optional().default(""),
  work_province: z.string().optional().default(""),
  work_telephone: z.string().optional().default(""),
  work_fax: z.string().optional().default(""),
  work_group: z.string().optional().default(""),
  unwork_type: z.string().optional().default("15"),
  unwork_other: z.string().optional().default(""),
  info_type: z.string().optional().default("04"),
  info_agree: z.string().optional().default("0"),
  info_findjob: z.string().optional().default("0"),
  info_findjob_detail: z.string().optional().default(""),
  info_findjob_detail_industry: z.string().optional().default(""),
  sign_img: z.string().optional().default(""),
  regist_date: z.string().optional().default(""),
  official: z.string().optional().default(""),
  gender: z.string().optional().default("1"),
  nationality: z.string().optional().default("099"),
  postcode: z.string().optional().default(""),
  info_findjob_country: z.string().optional().default(""),
  industry_desc: z.string().optional().default("00"),
  profileImage: z.string().optional().default(""),
  info_findjob_detail_industry_desc: z.string().optional().default("00"),
}).passthrough();

function parseProfileJson(rawJson, userContext) {
    if (!rawJson) return ProfileSchema.parse({});

    try {
        const parsed = JSON.parse(rawJson);
        const mapped = { ...parsed };

        if (!mapped.reg_citizenid && mapped.reg_pid) {
            mapped.reg_citizenid = mapped.reg_pid;
        }
        if (!mapped.reg_birth && mapped.reg_bdate) {
            mapped.reg_birth = mapped.reg_bdate.includes("T") ? mapped.reg_bdate : `${mapped.reg_bdate}T00:00:00`;
        }
        if (!mapped.reg_address_no && mapped.reg_addr_no !== undefined) mapped.reg_address_no = mapped.reg_addr_no;
        if (!mapped.reg_address_moo && mapped.reg_addr_moo !== undefined) mapped.reg_address_moo = mapped.reg_addr_moo;
        if (!mapped.reg_address_soi && mapped.reg_addr_soi !== undefined) mapped.reg_address_soi = mapped.reg_addr_soi;
        if (!mapped.reg_address_street && mapped.reg_addr_road !== undefined) mapped.reg_address_street = mapped.reg_addr_road;
        if (!mapped.reg_address_subdistrict && mapped.reg_addr_tumbon !== undefined) mapped.reg_address_subdistrict = mapped.reg_addr_tumbon;
        if (!mapped.reg_address_district && mapped.reg_addr_amphur !== undefined) mapped.reg_address_district = mapped.reg_addr_amphur;
        if (!mapped.reg_address_province && mapped.reg_addr_province !== undefined) mapped.reg_address_province = mapped.reg_addr_province;
        if (!mapped.postcode && mapped.reg_addr_zipcode !== undefined) mapped.postcode = mapped.reg_addr_zipcode;

        const legacyKeys = ["reg_pid", "reg_bdate", "reg_addr_no", "reg_addr_moo", "reg_addr_soi", "reg_addr_road", "reg_addr_tumbon", "reg_addr_amphur", "reg_addr_province", "reg_addr_zipcode"];
        legacyKeys.forEach(key => delete mapped[key]);

        if (mapped.profileImage && mapped.profileImage.startsWith("data:image")) {
            mapped.profileImage = mapped.profileImage.replace(/^data:image\/\w+;base64,/, '');
        }

        if (!mapped.regist_date) {
            mapped.regist_date = userContext?.createdAt ? new Date(userContext.createdAt).toISOString() : new Date().toISOString();
        }

        return ProfileSchema.parse(mapped);
    } catch (e) {
        return ProfileSchema.parse({});
    }
}

async function migrate() {
    console.log("Starting Profile JSON migration...");
    const users = await prisma.user.findMany({
        where: {
            profileJson: { not: null }
        }
    });

    console.log(`Found ${users.length} users with profileJson.`);
    let migratedCount = 0;

    for (const user of users) {
        try {
            const migratedObj = parseProfileJson(user.profileJson, { createdAt: user.createdAt });
            const migratedStr = JSON.stringify(migratedObj);

            if (user.profileJson !== migratedStr) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { profileJson: migratedStr }
                });
                migratedCount++;
            }
        } catch (e) {
            console.error(`Failed to migrate user ${user.id}:`, e);
        }
    }

    console.log(`Migration complete. Migrated ${migratedCount} out of ${users.length} users.`);
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
