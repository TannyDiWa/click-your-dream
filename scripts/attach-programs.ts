/**
 * Links the fields recommended to high school students (guidance in the high_school
 * explanations) to real bachelor's programs open in the current TCAS, using the official
 * myTCAS data (course.mytcas.com). For each field it keeps up to 3 programs from different
 * universities, and only programs that are listed in courses.json and have admission rounds
 * published for this year (rounds/<program_id>.json).
 *
 *   node scripts/attach-programs.ts            # writes guidance[].programs into explanations.json
 *   node scripts/attach-programs.ts --dry-run  # prints the matches only
 *
 * It also writes supabase/tcas-fields.json: every recommended field with all the TCAS programs
 * that match it (program and field page links), kept for later work.
 *
 * Then rebuild the seeds: npm run explanations -- --write-sql
 */
import { readFileSync, writeFileSync } from "node:fs";

const DATA = "https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas";
const PROGRAM_PAGE = "https://course.mytcas.com/programs/";
const TCAS_YEAR = "2570";
const PER_FIELD = 3;
// Spares per field, used when a result's earlier card already shows the same program.
const SPARES = 3;
const OUT = new URL("../supabase/explanations.json", import.meta.url);
const FIELDS_OUT = new URL("../supabase/tcas-fields.json", import.meta.url);

type Course = {
  university_id: string;
  faculty_id: string;
  field_id: string;
  university_type_id: string;
  university_name_th: string;
  campus_name_th: string;
  faculty_name_th: string;
  field_name_th: string;
  program_name_th: string;
  program_type_name_th: string;
  program_id: string;
};
type Round = { type: string; receive_student_number: number };
export type Program = {
  university: string;
  campus: string;
  faculty: string;
  program: string;
  /** myTCAS program page (details, seats per round) */
  url: string;
  /** myTCAS page listing this faculty's programs in the same field */
  fieldUrl: string;
  rounds: string[];
};

/**
 * Field title (as written in guidance) → pattern(s) on the program name, the way Thai programs
 * name the subject. An array is tried in order: closer programs first, broader ones after.
 */
// Business innovation programs (startups, digital business), for the innovation management fields.
const INNOVATION_BIZ = /การจัดการนวัตกรรมทางธุรกิจ|ผู้ประกอบการนวัตกรรม|การเปลี่ยนแปลงทางดิจิทัลและการจัดการเทคโนโลยี|นวัตกรรมธุรกิจดิจิทัล/;
const TECH_MGMT = /(การจัดการเทคโนโลยี|เทคโนโลยีการจัดการ)(?!.*(สิ่งแวดล้อม|ท่องเที่ยว|การค้า))/;

const MATCH: Record<string, RegExp | RegExp[]> = {
  "วิศวกรรมอุตสาหการ": /สาขาวิชาวิศวกรรมอุตสาหการ/,
  "การตลาด": /สาขาวิชาการตลาด/,
  "การบริหารทรัพยากรมนุษย์": /(การจัดการ|บริหาร)ทรัพยากรมนุษย์/,
  "การจัดการโลจิสติกส์และซัพพลายเชน": /โลจิสติกส์/,
  "เภสัชศาสตร์": /เภสัชศาสตรบัณฑิต/,
  "สารสนเทศศาสตร์และบรรณารักษศาสตร์": /บรรณารักษ|สารสนเทศศึกษา|(?<!ภูมิ|และ)สารสนเทศศาสตร์|การจัดการสารสนเทศ/,
  "การโรงแรมและการบริการ": /การโรงแรม/,
  "พยาบาลศาสตร์": /พยาบาลศาสตรบัณฑิต/,
  "การศึกษาปฐมวัย": /การศึกษาปฐมวัย/,
  "การโฆษณาและการสื่อสารแบรนด์": /โฆษณา/,
  "เศรษฐศาสตร์": /เศรษฐศาสตรบัณฑิต/,
  "การประชาสัมพันธ์และสื่อสารองค์กร": /ประชาสัมพันธ์|สื่อสารองค์กร/,
  "การจัดการอีเวนต์และงานพิธี": /อีเว้นท์|อีเวนต์|การจัดการงานอีเวนต์|ไมซ์|MICE/,
  "สถาปัตยกรรมภายใน": /สถาปัตยกรรมภายใน|ออกแบบภายใน/,
  "การจัดการธุรกิจสร้างสรรค์": /ธุรกิจสร้างสรรค์|การจัดการผลิตสื่อและอุตสาหกรรมสร้างสรรค์|การจัดการศิลปวัฒนธรรม|ธุรกิจศิลปะ/,
  "เทคโนโลยีและสื่อการศึกษา": /^(?!.*แพทย).*(เทคโนโลยี(และสื่อสาร|การศึกษา|และสื่อ)|เทคโนโลยีและนวัตกรรมการศึกษา|สื่อสารการศึกษา)/,
  "ออกแบบอุตสาหกรรม": /ออกแบบอุตสาหกรรม|ออกแบบผลิตภัณฑ์/,
  "กายภาพบำบัด": /กายภาพบำบัด/,
  "เทคนิคการแพทย์": /เทคนิคการแพทย์/,
  "เทคโนโลยีการพิมพ์และบรรจุภัณฑ์": /การพิมพ์|บรรจุภัณฑ์/,
  "วิทยาศาสตร์การกีฬาและการฝึกสอน": /วิทยาศาสตร์การกีฬา|การฝึกและการจัดการกีฬา|การฝึกสอนกีฬา/,
  "รังสีเทคนิค": /รังสีเทคนิค/,
  "การจัดการการท่องเที่ยว": /การท่องเที่ยว/,
  "การบริหารงานก่อสร้าง": /บริหารงานก่อสร้าง|การจัดการงานก่อสร้าง|เทคโนโลยีการก่อสร้าง|การก่อสร้าง/,
  "นิเทศศิลป์และการออกแบบสารสนเทศ": /นิเทศศิลป์|ออกแบบนิเทศศิลป์|ออกแบบสื่อสาร|ออกแบบกราฟิก/,
  "สาธารณสุขศาสตร์": /สาธารณสุขศาสตรบัณฑิต|สาธารณสุขชุมชน/,
  "การเงินและการลงทุน": /สาขาวิชาการเงิน|การเงินและการลงทุน|การเงินและการธนาคาร/,
  "การบัญชี": /บัญชีบัณฑิต/,
  "ออกแบบประสบการณ์ผู้ใช้": [/ประสบการณ์ผู้ใช้|UX|ออกแบบประสบการณ์สำหรับสื่อ|ออกแบบปฏิสัมพันธ์|ออกแบบสื่อปฏิสัมพันธ์/, /^(?!.*(กราฟิก|การศึกษาทางไกล)).*ออกแบบดิจิทัล/],
  "การเป็นผู้ประกอบการ": [/(สาขาวิชา|\(|\s)(การเป็น)?ผู้ประกอบการ\)?$|การจัดการการประกอบการ|สาขาวิชาการประกอบการ(?!เชิงนิเวศ)/, /ผู้ประกอบการ|การประกอบการ/],
  "ศิลปศึกษา": /ศิลปศึกษา/,
  "ศิลปะการประกอบอาหาร": /ประกอบอาหาร|ศิลปะการครัว|การจัดการครัว|ธุรกิจอาหาร/,
  "ออกแบบเครื่องแต่งกาย": /ออกแบบแฟชั่น|เครื่องแต่งกาย|ออกแบบเสื้อผ้า/,
  "กิจกรรมบำบัด": /กิจกรรมบำบัด/,
  "อาชีวอนามัยและความปลอดภัย": /อาชีวอนามัย/,
  "โภชนาการและการกำหนดอาหาร": /โภชนาการ|โภชนวิทยา|การกำหนดอาหาร/,
  "การจัดการอีเวนต์และอุตสาหกรรมบันเทิง": [/อุตสาหกรรมบันเทิง|อีเวนต์และธุรกิจบันเทิง|งานนิทรรศการและงานอีเวนต์/, /อีเว้นท์|อีเวนต์/],
  "วิทยาศาสตร์และเทคโนโลยีการอาหาร": /วิทยาศาสตร์และเทคโนโลยีการอาหาร|เทคโนโลยีการอาหาร|วิทยาศาสตร์การอาหาร/,
  "เทคโนโลยีสารสนเทศ": /สาขาวิชาเทคโนโลยีสารสนเทศ/,
  "นิติวิทยาศาสตร์": /นิติวิทยาศาสตร์/,
  "การจัดการนวัตกรรม": [INNOVATION_BIZ, TECH_MGMT],
  // Not the primary-teaching programs that add guidance as a minor.
  "จิตวิทยาการปรึกษา": [/^(?!.*ประถมศึกษา).*(จิตวิทยาการปรึกษา|จิตวิทยาการให้คำปรึกษา|จิตวิทยาการแนะแนว|จิตวิทยาและการแนะแนว)/, /^(?!.*ประถมศึกษา).*จิตวิทยา/],
  "รัฐศาสตร์ สาขานโยบายสาธารณะ": /นโยบายสาธารณะ|รัฐประศาสนศาสตร์|รัฐศาสตรบัณฑิต/,
  "บริหารธุรกิจ สาขาการจัดการ": [/(บริหารธุรกิจบัณฑิต|บธ\.บ\.) ?(สาขาวิชา)?การจัดการ$/, /สาขาวิชาการจัดการธุรกิจ$|การจัดการธุรกิจ$/],
  "จิตวิทยาอุตสาหกรรมและองค์การ": [/จิตวิทยาอุตสาหกรรม|จิตวิทยาองค์การ/, /จิตวิทยา/],
  "สถิติและวิทยาการข้อมูล": /วิทยาการข้อมูล|สถิติ/,
  "พิพิธภัณฑ์ศึกษาและประวัติศาสตร์ศิลปะ": [/ประวัติศาสตร์ศิลป|พิพิธภัณฑ์|โบราณคดี/, /สาขาวิชาประวัติศาสตร์$|ประวัติศาสตร์$/],
  "สถิติประยุกต์": /สถิติ/,
  "ศิลปะการแสดง": /ศิลปะการแสดง|การละคร|ละคร/,
  "วารสารศาสตร์และการจัดการสื่อ": [/วารสารศาสตร์|การจัดการสื่อ/, /สื่อสารมวลชน|นิเทศศาสตรบัณฑิต$/],
  "การจัดการแฟชั่นและสินค้าไลฟ์สไตล์": [/ธุรกิจแฟชั่น|การจัดการแฟชั่น|การตลาดแฟชั่น|แฟชั่นและการจัดการสินค้า|การตลาด-การค้าปลีก/, /การค้าปลีก/],
  // The general teaching degrees (majors chosen inside); bare "ครุศาสตรบัณฑิต" names are single majors.
  "ครุศาสตร์และศึกษาศาสตร์": /^หลักสูตร(ครุศาสตรบัณฑิต|การศึกษาบัณฑิต)( สาขาวิชาการศึกษา)?$/,
  "การบริหารสาธารณสุข": /บริหารสาธารณสุข|สาธารณสุขศาสตร/,
  "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ": /หุ่นยนต์/,
  "วิศวกรรมไฟฟ้าและพลังงาน": /วิศวกรรมไฟฟ้า|วิศวกรรมพลังงาน/,
  "การจัดการเทคโนโลยี": [TECH_MGMT, INNOVATION_BIZ],
  "วิศวกรรมโยธา": /สาขาวิชาวิศวกรรมโยธา/,
  "วิศวกรรมการบินและอวกาศ": [/การบินและอวกาศ|วิศวกรรมการบิน|วิศวกรรมอากาศยาน/, /อากาศยาน/],
  "ออกแบบผลิตภัณฑ์": /ออกแบบผลิตภัณฑ์|ออกแบบอุตสาหกรรม/,
  "การถ่ายภาพและภาพยนตร์": /ภาพยนตร์|การถ่ายภาพ/,
  "ภูมิสถาปัตยกรรม": /ภูมิสถาปัตยกรรม/,
  "ออกแบบแฟชั่นและสิ่งทอ": [/ออกแบบแฟชั่น|ออกแบบสิ่งทอ/, /สิ่งทอ/],
  "สถาปัตยกรรมศาสตร์": /^(หลักสูตร)?สถาปัตยกรรมศาสตรบัณฑิต(?!.*(ภูมิ|ภายใน|ผังเมือง|ออกแบบ))/,
  "เทคโนโลยีการเกษตรและธุรกิจเกษตร": /ธุรกิจเกษตร|เทคโนโลยีการเกษตร|เกษตรศาสตร์/,
  "การจัดการโลจิสติกส์และปฏิบัติการ": /โลจิสติกส์/,
  "เทคโนโลยีการอาหาร สาขาเบเกอรี่": /เบเกอรี่|ขนมอบ|เทคโนโลยีการอาหาร|ประกอบอาหาร/,
  "เทคโนโลยีการก่อสร้าง": /เทคโนโลยีการก่อสร้าง|การก่อสร้าง|บริหารงานก่อสร้าง/,
  "วิทยาการคอมพิวเตอร์ สาขาเกมและสื่อ": /เกม|มัลติมีเดีย/,
  "แพทยศาสตร์": /(?<!สัตว|ทันต|ฉุกเฉินการ)แพทยศาสตรบัณฑิต/,
  "วิศวกรรมเมคคาทรอนิกส์": /^(?!.*เกษตร).*(เมคคาทรอนิกส์|แมคคาทรอนิกส์|เมคาทรอนิกส์)/,
  "ออกแบบปฏิสัมพันธ์และสื่อดิจิทัล": /ออกแบบปฏิสัมพันธ์|สื่อปฏิสัมพันธ์|ออกแบบประสบการณ์สำหรับสื่อ|อินเทอร์แอคทีฟ|ดิจิทัลอาร์ต/,
  "จิตวิทยา": /จิตวิทยา/,
  "วิทยาการข้อมูล": /วิทยาการข้อมูล/,
  "สารสนเทศสุขภาพ": /สารสนเทศสุขภาพ|สารสนเทศทางการแพทย์|เวชระเบียน|ข้อมูลสุขภาพ/,
  "วิศวกรรมการเงิน": [/วิศวกรรมการเงิน/, /การเงินเชิงปริมาณ|คณิตศาสตร์การเงิน|การเงินเชิงคำนวณ|เทคโนโลยีทางการเงิน|ฟินเทค/],
  "คณิตศาสตร์ประกันภัย": /^(?!.*บริหารธุรกิจประกันภัย).*ประกันภัย/,
  "ภาษาและการแปล": /การแปล|ภาษาอังกฤษ/,
  "การสอนวิทยาศาสตร์": /(ศึกษาศาสตรบัณฑิต|ครุศาสตรบัณฑิต|การศึกษาบัณฑิต|ศษ\.บ\.|ค\.บ\.|กศ\.บ\.).*(วิทยาศาสตร์|ฟิสิกส์|เคมี|ชีววิทยา)|วิทยาศาสตร์ศึกษา|การสอนวิทยาศาสตร์/,
  "ศิลปประยุกต์และหัตถศิลป์": /หัตถศิลป์|หัตถกรรมสร้างสรรค์|หัตถอุตสาหกรรม|ศิลปประยุกต์และออกแบบผลิตภัณฑ์/,
  "นิเทศศิลป์": /นิเทศศิลป์|ออกแบบนิเทศศิลป์|ออกแบบกราฟิก/,
  "ออกแบบบรรจุภัณฑ์": [/ออกแบบบรรจุภัณฑ์|ออกแบบผลิตภัณฑ์และบรรจุภัณฑ์/, /บรรจุภัณฑ์/],
  "การสอนภาษาและวรรณกรรม": [/การสอนภาษา|(ศึกษาศาสตรบัณฑิต|ครุศาสตรบัณฑิต|การศึกษาบัณฑิต|ศษ\.บ\.|ค\.บ\.|กศ\.บ\.).*(ภาษาไทย|ภาษาอังกฤษ)/],
  "การผลิตสื่อดิจิทัลและคอนเทนต์": /สื่อดิจิทัล|คอนเทนต์|นิเทศศาสตร์ดิจิทัล|สื่อใหม่/,
  "ออกแบบเชิงกลยุทธ์และนวัตกรรม": /นวัตกรรมการออกแบบ|ออกแบบเชิงกลยุทธ์|การจัดการการออกแบบ|ออกแบบ/,
  "การจัดการวัฒนธรรมและชุมชน": [/การจัดการวัฒนธรรม|การจัดการทางวัฒนธรรม|การพัฒนาชุมชน|วัฒนธรรมศึกษา/, /วัฒนธรรม/],
  "การบริบาลผู้สูงอายุ": [/ผู้สูงอายุ|สูงวัย|ผู้สูงวัย|การบริบาล(?!ทางเภสัช)/, /สาธารณสุขชุมชน/],
  "สังคมสงเคราะห์ศาสตร์": /สังคมสงเคราะห์/,
  "การพัฒนาทรัพยากรมนุษย์": /พัฒนาทรัพยากรมนุษย์|ทรัพยากรมนุษย์/,
  "การจัดการกิจการเพื่อสังคม": /ธุรกิจเพื่อสังคม|กิจการเพื่อสังคม|ผู้ประกอบการสังคม|นวัตกรรมสังคม|การประกอบการสาธารณะ/,
  "การจัดการอีเวนต์และไมซ์": /ไมซ์|MICE|อีเว้นท์|อีเวนต์/,
  "การเงินและการวางแผนการเงิน": /การวางแผนการเงิน|สาขาวิชาการเงิน|การเงินและการลงทุน/,
  "การเงินการธนาคาร": /การเงินการธนาคาร|การเงินและการธนาคาร|การธนาคาร|สาขาวิชาการเงิน/,
  "วิศวกรรมเครื่องกล": /สาขาวิชาวิศวกรรมเครื่องกล/,
  "วิศวกรรมชีวการแพทย์": /ชีวการแพทย์/,
  "วิทยาการคอมพิวเตอร์ สาขาเครือข่ายและความปลอดภัย": /ความมั่นคงปลอดภัย|ไซเบอร์|เครือข่าย/,
  "เครื่องเคลือบดินเผาและวัสดุ": [/ออกแบบเซรามิก|เซรามิกส์และแก้ว|เครื่องเคลือบดินเผา|ศิลปะเซรามิก/, /เซรามิก/],
  "สัตวแพทยศาสตร์": /สัตวแพทยศาสตรบัณฑิต/,
  "นันทนาการและการจัดกิจกรรม": /นันทนาการ/,
  "การจัดการการท่องเที่ยวและการบริการ": /การท่องเที่ยว|การบริการ/,
  "วิศวกรรมโยธาและการบริหารงานก่อสร้าง": /สาขาวิชาวิศวกรรมโยธา/,
  "วิทยาศาสตร์การออกกำลังกายและการกีฬา": /วิทยาศาสตร์การออกกำลังกาย|วิทยาศาสตร์การกีฬา/,
  "การจัดการอาคารและทรัพย์สิน": /อสังหาริมทรัพย์|การจัดการอาคาร|ทรัพย์สิน/,
  "สถาปัตยกรรมและการออกแบบภายใน": /สถาปัตยกรรมภายใน|ออกแบบภายใน/,
  "วิทยาศาสตร์สิ่งแวดล้อม": [/วิทยาศาสตร์สิ่งแวดล้อม/, /สิ่งแวดล้อม/],
  "นวัตกรรมและการจัดการเทคโนโลยี": [TECH_MGMT, INNOVATION_BIZ],
  "ธรณีวิทยา": /ธรณีวิทยา|ธรณีศาสตร์/,
  "วารสารศาสตร์และสื่อสารคดี": [/วารสารศาสตร์|สารคดี/, /สื่อสารมวลชน|นิเทศศาสตรบัณฑิต/],
  "สังคมวิทยาและมานุษยวิทยา": /สังคมวิทยา|มานุษยวิทยา/,
  "ออกแบบเชิงกลยุทธ์": /ออกแบบเชิงกลยุทธ์|การจัดการการออกแบบ|นวัตกรรมการออกแบบ/,
  "สารสนเทศศาสตร์": /(?<!ภูมิ|และ)สารสนเทศศาสตร์|สารสนเทศศึกษา|บรรณารักษ|การจัดการสารสนเทศ/,
  "ทันตแพทยศาสตร์": /ทันตแพทยศาสตรบัณฑิต/,
  "การศึกษาและการออกแบบการเรียนรู้": [/การออกแบบการเรียนรู้|การเรียนรู้/, /^(หลักสูตร)?ครุศาสตรบัณฑิต$|การประถมศึกษา/],
  "ปรัชญาและศาสนา": /ปรัชญา|ศาสนา/,
  "วิทยาการคอมพิวเตอร์": /สาขาวิชาวิทยาการคอมพิวเตอร์/,
  "เคมี": /^(หลักสูตร)?(วิทยาศาสตรบัณฑิต|วท\.บ\.) ?(สาขาวิชา)?เคมี$/,
  "ประติมากรรมและศิลปะสื่อผสม": [/ประติมากรรม|สื่อผสม/, /ทัศนศิลป์|จิตรกรรม/],
  "แอนิเมชันและเอฟเฟกต์": /แอนิเมชัน|แอนิเมชั่น|แอนนิเมชัน/,
  "ออกแบบของเล่นและผลิตภัณฑ์เด็ก": /ของเล่น|ออกแบบผลิตภัณฑ์/,
  "วิศวกรรมเสียงและดนตรี": /วิศวกรรมดนตรี|เทคโนโลยีดนตรี|เทคโนโลยีการดนตรี|วิศวกรรมเสียง|ดนตรีและเทคโนโลยี|การผลิตดนตรี|ดนตรีดิจิทัล|ดนตรีและสื่อสร้างสรรค์|ธุรกิจดนตรี/,
  "การเขียนเชิงสร้างสรรค์และวรรณกรรม": [/การเขียน|วรรณกรรม|วรรณคดี/, /^(หลักสูตร)?(ศิลปศาสตรบัณฑิต|อักษรศาสตรบัณฑิต|ศศ\.บ\.) ?(สาขาวิชา)?ภาษาไทย/],
  "ภาพยนตร์และสื่อสารคดี": /ภาพยนตร์/,
  "การผลิตภาพยนตร์และสื่อ": /ภาพยนตร์/,
  "ภาพยนตร์และสื่อดิจิทัล": /ภาพยนตร์/,
  "ภูมิสารสนเทศ": /ภูมิสารสนเทศ|ภูมิศาสตร์/,
  "วิทยาศาสตร์การกีฬา": /วิทยาศาสตร์การกีฬา/,
  "การศึกษาพิเศษ": /การศึกษาพิเศษ/,
  "นาฏศิลป์และการเคลื่อนไหว": /นาฏศิลป์|นาฏยศิลป์|การแสดง/,
  "พลศึกษา": /พลศึกษา/,
  "การจัดการการท่องเที่ยวเชิงผจญภัย": /การท่องเที่ยว/,
  "การสอนคณิตศาสตร์": /คณิตศาสตร์ศึกษา|การสอนคณิตศาสตร์|ครุศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์|ศึกษาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์|การศึกษาบัณฑิต สาขาวิชาคณิตศาสตร์/,
  "จิตวิทยาพัฒนาการ": [/จิตวิทยาพัฒนาการ|จิตวิทยาเด็ก/, /จิตวิทยา/],
  "เวชกิจฉุกเฉิน": /ฉุกเฉิน/,
  "การจัดการเทคโนโลยีและนวัตกรรม": [TECH_MGMT, INNOVATION_BIZ],
  "ศิลปะการประกอบอาหารและการจัดการครัว": /ประกอบอาหาร|ศิลปะการครัว|การจัดการครัว/,
  "การจัดการธุรกิจอาหาร": /ธุรกิจอาหาร|ธุรกิจบริการอาหาร|การจัดการอาหาร/,
  "วิศวกรรมการจัดการ": /วิศวกรรมการจัดการ|วิศวกรรมอุตสาหการ/,
  "วิศวกรรมสำรวจ": /วิศวกรรมสำรวจ/,
  "วิทยาการคอมพิวเตอร์ สาขาความปลอดภัยไซเบอร์": /ไซเบอร์|ความมั่นคงปลอดภัย/,
  "การอนุรักษ์และบูรณะศิลปวัตถุ": [/อนุรักษ์ศิลป|บูรณะ|อนุรักษ์และ(ซ่อม|บูรณะ)/, /โบราณคดี|ประวัติศาสตร์ศิลป|พิพิธภัณฑ์|มรดก/],
  "สุขาภิบาลอาหารและความปลอดภัย": /อาชีวอนามัย|สุขาภิบาล|อนามัยสิ่งแวดล้อม/,
};

const programUrl = (c: Course) => `${PROGRAM_PAGE}${c.program_id}`;
const fieldUrl = (c: Course) =>
  `https://course.mytcas.com/universities/${c.university_id}/faculties/${c.faculty_id}/fields/${c.field_id}`;

// Catch-all or group entries that are not one program (e.g. a whole faculty group, a list of 20 majors).
const NOT_A_PROGRAM = /วารสารศาสตร์ อักษรศาสตร์ ศิลปศาสตร์|^กลุ่ม|^.{250,}/;

// Program types a high school graduate applies to; continuing/transfer programs are left out.
const TYPE_RANK: Record<string, number> = { "ภาษาไทย ปกติ": 0, "ภาษาไทย พิเศษ": 1, "สองภาษา/สามภาษา": 2, "นานาชาติ": 3 };

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Admission rounds published for this TCAS year, e.g. ["รอบ 1", "รอบ 2"]; empty when not open. */
async function openRounds(programId: string): Promise<string[]> {
  const rounds = (await fetchJson<Round[]>(`${DATA}/rounds/${programId}.json`)) ?? [];
  const nums = new Set(
    rounds.filter((r) => r.type.endsWith(`_${TCAS_YEAR}`) && r.receive_student_number > 0).map((r) => r.type.split("_")[0]),
  );
  return [...nums].sort().map((n) => `รอบ ${n}`);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const courses = (await fetchJson<Course[]>(`${DATA}/courses.json`)) ?? [];
  if (!courses.length) throw new Error("Could not load myTCAS courses.json");
  // One entry per program (courses.json repeats a program for each major).
  const programs = [...new Map(courses.map((c) => [c.program_id, c])).values()].filter((c) => c.program_type_name_th in TYPE_RANK);

  const rows = JSON.parse(readFileSync(OUT, "utf8"));
  const titles = new Set<string>();
  for (const r of Object.values<{ group: string; content: { guidance: { title: string }[] } }>(rows)) {
    if (r.group === "high_school") for (const g of r.content.guidance) titles.add(g.title);
  }

  const chosen = new Map<string, Program[]>();
  const allMatches = new Map<string, Course[]>();
  const roundCache = new Map<string, string[]>();
  for (const title of titles) {
    const pattern = MATCH[title];
    if (!pattern) {
      console.warn(`No pattern for ${title}`);
      continue;
    }
    // Program names, tier by tier; the TCAS field name only fills in when that finds too few.
    // (Faculty names are not used: a faculty of medical technology also runs physiotherapy.)
    const tiers = Array.isArray(pattern) ? pattern : [pattern];
    const sorted = (list: Course[]) => [...list].sort(
        (a, b) =>
          TYPE_RANK[a.program_type_name_th] - TYPE_RANK[b.program_type_name_th] ||
          Number(a.university_type_id) - Number(b.university_type_id) ||
          a.university_id.localeCompare(b.university_id) ||
          a.program_id.localeCompare(b.program_id),
      );
    const used = new Set<string>();
    const take = (list: Course[]) => {
      const fresh = list.filter((c) => !used.has(c.program_id) && !NOT_A_PROGRAM.test(c.program_name_th));
      for (const c of fresh) used.add(c.program_id);
      return sorted(fresh);
    };
    const candidates = tiers.flatMap((re) => take(programs.filter((c) => re.test(c.program_name_th))));
    if (new Set(candidates.map((c) => c.university_id)).size < PER_FIELD) {
      candidates.push(...tiers.flatMap((re) => take(programs.filter((c) => re.test(c.field_name_th)))));
    }
    allMatches.set(title, candidates);
    const picks: Program[] = [];
    const seen = new Set<string>();
    for (const c of candidates) {
      if (picks.length === PER_FIELD + SPARES) break;
      if (seen.has(c.university_id)) continue;
      if (!roundCache.has(c.program_id)) roundCache.set(c.program_id, await openRounds(c.program_id));
      const rounds = roundCache.get(c.program_id)!;
      if (!rounds.length) continue;
      seen.add(c.university_id);
      picks.push({
        university: c.university_name_th,
        campus: c.campus_name_th,
        faculty: c.faculty_name_th,
        program: c.program_name_th,
        url: programUrl(c),
        fieldUrl: fieldUrl(c),
        rounds,
      });
    }
    chosen.set(title, picks);
    const shown = picks.slice(0, PER_FIELD);
    console.log(`${shown.length}/${PER_FIELD} ${title} (${candidates.length} matches)`);
    for (const p of shown) console.log(`    ${p.university} • ${p.program} • ${p.rounds.join(", ")}`);
  }

  if (dryRun) return;
  const fields = Object.fromEntries(
    [...allMatches].sort(([a], [b]) => a.localeCompare(b, "th")).map(([title, list]) => [
      title,
      {
        pattern: [MATCH[title]].flat().map((re) => re.source),
        picked: (chosen.get(title) ?? []).slice(0, PER_FIELD).map((p) => p.url),
        programs: list.map((c) => ({
          university: c.university_name_th,
          campus: c.campus_name_th,
          faculty: c.faculty_name_th,
          field: c.field_name_th,
          program: c.program_name_th,
          type: c.program_type_name_th,
          url: programUrl(c),
          fieldUrl: fieldUrl(c),
        })),
      },
    ]),
  );
  writeFileSync(FIELDS_OUT, JSON.stringify({ source: `${DATA}/courses.json`, tcasYear: TCAS_YEAR, fields }, null, 2) + "\n");
  console.log(`Wrote supabase/tcas-fields.json (${allMatches.size} fields)`);
  for (const r of Object.values<{ group: string; content: { guidance: { title: string; programs?: Program[] }[] } }>(rows)) {
    if (r.group !== "high_school") continue;
    // Cards of one result never repeat a program; a later card takes the next spare instead.
    const shownUrls = new Set<string>();
    for (const g of r.content.guidance) {
      g.programs = (chosen.get(g.title) ?? []).filter((p) => !shownUrls.has(p.url)).slice(0, PER_FIELD);
      for (const p of g.programs) shownUrls.add(p.url);
    }
  }
  writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");
  console.log("Wrote supabase/explanations.json — now run: npm run explanations -- --write-sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
