type NotificationBannerProps = {
  newApplications: number;
};

const NotificationBanner = ({
  newApplications,
}: NotificationBannerProps) => {
  return (
    <div className="mb-6 rounded-2xl px-6 py-4 bg-brand-teal text-white">
      <span className="font-semibold">{newApplications} new applications</span> received this week
    </div>
  );
};

export default NotificationBanner;
