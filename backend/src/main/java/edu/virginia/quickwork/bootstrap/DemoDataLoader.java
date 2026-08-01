package edu.virginia.quickwork.bootstrap;

import edu.virginia.quickwork.config.QuickWorkProperties;
import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.*;
import edu.virginia.quickwork.service.LedgerService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Loads a demo dataset covering every state so the app is explorable on a
 * fresh database. Disable with {@code quickwork.seed-demo-data=false}.
 */
@Configuration
public class DemoDataLoader {

    @Bean
    ApplicationRunner seedDemoData(QuickWorkProperties props,
                                   UserRepository users,
                                   JobRepository jobs,
                                   JobApplicationRepository applications,
                                   ReviewRepository reviews,
                                   MessageRepository messages,
                                   FeedbackRepository feedback,
                                   DisputeRepository disputes,
                                   LedgerService ledger) {
        return args -> {
            if (!props.isSeedDemoData() || users.count() > 0) return;

            Instant now = Instant.now();

            // --- people ---
            User admin = user(users, "QuickWork Admin", "admin@quickwork.app", UserRole.ADMIN, "#232D4B");

            User maya = student(users, "Maya Patel", "mp4ge@virginia.edu", "3rd Year", "#E57200",
                    "Third-year Econ major. Reliable, strong, and weirdly good at parallel parking.",
                    List.of("Moving & Lifting", "Photography", "Tutoring (Calc)", "Dog Walking"));
            User devon = student(users, "Devon Brooks", "db8xk@virginia.edu", "2nd Year", "#232D4B",
                    "CS + Studio Art double major. I build websites and fix the wifi your dad gave up on.",
                    List.of("Web Design", "Flyer Design", "Tech Setup"));
            User aisha = student(users, "Aisha Khan", "ak2mn@virginia.edu", "4th Year", "#1B7F5C",
                    "Fourth-year, hospitality minor. Calm under pressure, never drops a tray.",
                    List.of("Catering Help", "Bartending (cert)", "Event Setup"));
            User marcus = student(users, "Marcus Webb", "mw7pq@virginia.edu", "1st Year", "#B8860B",
                    "First-year. Happy to do the heavy stuff nobody else wants.",
                    List.of("Moving & Lifting", "Yard Work", "Car Washing"));
            User priya = student(users, "Priya Raman", "pr3vs@virginia.edu", "Grad Student", "#0F766E",
                    "Stats PhD student. I tutor and clean up messy spreadsheets.",
                    List.of("Tutoring (Stats)", "Data Entry", "Editing"));

            User karen = lister(users, "Karen Whitfield", "karen@example.com", "Belmont resident", "#7A4FB0");
            User lucia = lister(users, "Lucia Romano", "lucia@gritcoffee.com", "Grit Coffee — owner", "#C0392B");
            User tom = lister(users, "Tom Reedy", "tom@example.com", "Rugby Rd. resident", "#2E86C1");
            User dana = lister(users, "Dana Alvarez", "dana@example.com", "Fry's Spring resident", "#B8543F");

            // --- open listings ---
            Job couch = job(jobs, ledger, "Help move a couch up 3 flights",
                    "Need 1–2 strong students to carry a sleeper couch up to a 3rd-floor walkup. Dolly available.",
                    "Moving", "45.00", tom, "Rugby Road", "Sat Jun 14 · 10:00 AM", "~2 hrs",
                    now.plus(Duration.ofHours(26)), JobStatus.OPEN);
            apply(applications, couch, devon);
            apply(applications, couch, marcus);

            Job menu = job(jobs, ledger, "Design a new menu for our cafe",
                    "Grit Coffee needs a fresh printable menu. Clean, modern layout.",
                    "Design", "60.00", lucia, "The Corner", "Flexible this week", "1–2 days",
                    now.plus(Duration.ofHours(60)), JobStatus.OPEN);
            apply(applications, menu, devon);
            apply(applications, menu, priya);

            Job tailgate = job(jobs, ledger, "Tailgate setup + teardown crew",
                    "Help set up tents, tables, and coolers before the game and pack up after.",
                    "Events", "40.00", karen, "Scott Stadium", "Sat Jun 14 · 8:00 AM", "3 hrs",
                    now.plus(Duration.ofHours(24)), JobStatus.OPEN);
            apply(applications, tailgate, aisha);

            // --- pending admin approval ---
            job(jobs, ledger, "Bartend a graduation party",
                    "Certified bartender needed for ~40 guests. Beer and wine only.",
                    "Events", "120.00", dana, "Belmont", "Sat Jun 21 · 7:00 PM", "4 hrs",
                    now.plus(Duration.ofHours(80)), JobStatus.PENDING_APPROVAL);

            job(jobs, ledger, "Photograph our porch sale",
                    "Want crisp photos of items for an online sale. Bring your own camera.",
                    "Photography", "35.00", lucia, "Wertland St.", "Sun Jun 15 · 9:00 AM", "2 hrs",
                    now.plus(Duration.ofHours(44)), JobStatus.PENDING_APPROVAL);

            // --- hired, in progress ---
            Job dogs = job(jobs, ledger, "Dog sitting — golden retriever, 2 nights",
                    "Friendly 4-yr-old golden named Biscuit. Two walks a day.",
                    "Pet Care", "75.00", tom, "Lewis Mountain", "Jun 20–22", "2 nights",
                    now.plus(Duration.ofHours(30)), JobStatus.HIRED);
            hire(applications, dogs, maya);
            messages.save(new Message(dogs, tom, "Hi Maya! Thanks for taking Biscuit. He eats at 8 & 6."));
            messages.save(new Message(dogs, maya, "Got it! I'll send photos each day."));

            // --- hired, student marked complete, waiting on lister ---
            Job clean = job(jobs, ledger, "Deep clean a 2-bedroom apartment",
                    "Move-out clean: kitchen, two baths, floors. Supplies provided.",
                    "Cleaning", "90.00", dana, "Fry's Spring", "Thu Jun 12 · 1:00 PM", "3 hrs",
                    now.minus(Duration.ofHours(20)), JobStatus.HIRED);
            hire(applications, clean, marcus);
            clean.setMarkedDoneAt(now.minus(Duration.ofHours(18)));
            clean.setReminderSentAt(now.minus(Duration.ofHours(18)));

            // --- hired, window passed; the scheduler will auto-remind on boot ---
            Job stats = job(jobs, ledger, "Stats tutoring — regression review",
                    "Need a walkthrough of multiple regression before an exam.",
                    "Tutoring", "35.00", karen, "Alderman Library", "Wed Jun 11 · 4:00 PM", "1 hr",
                    now.minus(Duration.ofHours(5)), JobStatus.HIRED);
            hire(applications, stats, priya);

            // --- disputed ---
            Job yard = job(jobs, ledger, "Haul yard waste to the dump",
                    "Two truckloads of branches and clippings. Truck provided.",
                    "Yard Work", "55.00", dana, "Fry's Spring", "Sun Jun 8 · 9:00 AM", "2 hrs",
                    now.minus(Duration.ofDays(4)), JobStatus.DISPUTED);
            hire(applications, yard, marcus);
            Dispute dispute = disputes.save(new Dispute(yard, marcus));
            DisputeEvidence e1 = new DisputeEvidence(dispute, marcus,
                    "I hauled both loads on Sunday morning and sent the dump receipt, but I haven't been paid.");
            DisputeEvidence e2 = new DisputeEvidence(dispute, dana,
                    "Only one load went out as far as I could tell. Happy to split the difference.");
            dispute.getEvidence().add(e1);
            dispute.getEvidence().add(e2);
            disputes.save(dispute);

            // --- completed with payouts ---
            Job formal = job(jobs, ledger, "Photograph a sorority formal",
                    "Candids and group shots, edited delivery within a week.",
                    "Photography", "110.00", tom, "Boar's Head", "Sat Jun 7 · 8:00 PM", "3 hrs",
                    now.minus(Duration.ofDays(5)), JobStatus.HIRED);
            hire(applications, formal, devon);
            complete(jobs, ledger, formal, devon);

            Job dinner = job(jobs, ledger, "Serve at faculty dinner",
                    "Plated dinner service for 60 guests at a faculty reception.",
                    "Events", "80.00", karen, "Newcomb Hall", "Fri May 30 · 5:00 PM", "4 hrs",
                    now.minus(Duration.ofDays(3)), JobStatus.HIRED);
            hire(applications, dinner, aisha);
            complete(jobs, ledger, dinner, aisha);
            reviews.save(new Review(dinner, aisha, karen, 5, "Aisha ran our reception flawlessly."));

            Job corgis = job(jobs, ledger, "Weekend dog sitting — two corgis",
                    "Two corgis, three walks a day. Stay-over preferred.",
                    "Pet Care", "120.00", dana, "Fry's Spring", "Fri May 16 – Sun May 18", "2 nights",
                    now.minus(Duration.ofDays(16)), JobStatus.HIRED);
            hire(applications, corgis, maya);
            complete(jobs, ledger, corgis, maya);
            reviews.save(new Review(corgis, maya, dana, 5, "Maya sent photos every day. Great with the dogs."));

            // --- cancelled & refunded ---
            Job shelves = job(jobs, ledger, "Assemble two IKEA bookshelves",
                    "Changed plans — handled it myself.",
                    "Moving", "50.00", tom, "Wertland St.", "Mon Jun 9 · 6:00 PM", "2 hrs",
                    now.minus(Duration.ofDays(2)), JobStatus.CANCELLED);
            ledger.refundLister(shelves, "Listing cancelled by lister");

            // --- help desk ---
            feedback.save(new Feedback(devon, "Map pin overlap",
                    "When two jobs are close the pins overlap and I can't tap the back one."));
            feedback.save(new Feedback(lucia, "Refund question",
                    "If no one applies, do I get my hold back automatically?"));
            Feedback answered = new Feedback(priya, "Payout timing",
                    "How long after a lister approves does the money land in my account?");
            answered.setReply("Transfers land in 1–2 business days once the lister approves completion.");
            answered.setRepliedBy(admin);
            answered.setRepliedAt(now.minus(Duration.ofDays(1)));
            feedback.save(answered);
        };
    }

    // ---- helpers -------------------------------------------------------

    private User user(UserRepository users, String name, String email, UserRole role, String color) {
        User u = new User(name, email, role);
        u.setColor(color);
        return users.save(u);
    }

    private User student(UserRepository users, String name, String email, String year,
                         String color, String bio, List<String> skills) {
        User u = new User(name, email, UserRole.STUDENT);
        u.setColor(color);
        u.setYear(year);
        u.setBio(bio);
        u.setSkills(List.copyOf(skills));
        u.setVerified(true);
        u.setPayoutConfigured(true);
        u.setPayoutLast4(String.valueOf(1000 + Math.abs(email.hashCode() % 9000)));
        return users.save(u);
    }

    private User lister(UserRepository users, String name, String email, String org, String color) {
        User u = new User(name, email, UserRole.LISTER);
        u.setColor(color);
        u.setOrganization(org);
        return users.save(u);
    }

    private Job job(JobRepository jobs, LedgerService ledger, String title, String description,
                    String category, String price, User lister, String location, String schedule,
                    String duration, Instant endsAt, JobStatus status) {
        Job job = new Job(title, description, category, new BigDecimal(price), lister);
        job.setLocationName(location);
        job.setScheduleLabel(schedule);
        job.setDurationLabel(duration);
        job.setEndsAt(endsAt);
        job.setStatus(status);
        Job saved = jobs.save(job);
        ledger.captureForNewJob(saved);
        return saved;
    }

    private void apply(JobApplicationRepository applications, Job job, User student) {
        applications.save(new JobApplication(job, student, null));
    }

    private void hire(JobApplicationRepository applications, Job job, User student) {
        JobApplication application = new JobApplication(job, student, null);
        application.setStatus(ApplicationStatus.HIRED);
        applications.save(application);
        job.setHiredStudent(student);
    }

    private void complete(JobRepository jobs, LedgerService ledger, Job job, User student) {
        job.setStatus(JobStatus.COMPLETED);
        job.setCompletedAt(Instant.now());
        jobs.save(job);
        ledger.releaseToStudent(job, student, "Completion approved by lister");
    }
}
