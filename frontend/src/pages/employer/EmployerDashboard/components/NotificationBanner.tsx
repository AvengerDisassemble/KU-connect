type NotificationBannerProps = {
  newApplications: number;
};

const NotificationBanner = ({
  newApplications,
}: NotificationBannerProps) => {
  return (
    <div className="mb-6 rounded-2xl bg-primary px-6 py-4 text-white">
      <span className="font-semibold">
        {newApplications} new applications
      </span>{" "}
      received this week
    </div>
  );
};

export default NotificationBanner;
