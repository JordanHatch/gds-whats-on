require 'rubygems'
require 'google/api_client'
require 'active_support/all'
require 'sinatra/base'

class ApiClient
  attr_accessor :client
  cattr_accessor :instance

  def initialize
    @client = Google::APIClient.new

    key = Google::APIClient::KeyUtils.load_from_pkcs12(Base64.decode64(ENV["google_client_key"]), 'notasecret')
    @client.authorization = Signet::OAuth2::Client.new(
      :token_credential_uri => 'https://accounts.google.com/o/oauth2/token',
      :audience => 'https://accounts.google.com/o/oauth2/token',
      :scope => 'https://www.googleapis.com/auth/calendar.readonly',
      :issuer => ENV["google_issuer"],
      :signing_key => key
    )
    @client.authorization.fetch_access_token!
  end

  def events
    @client.execute(:api_method => service.events.list, :parameters => {
      'calendarId' => ENV["google_calendar_id"],
      'timeMin' => DateTime.now.to_s,
      'timeMax' => 7.days.from_now.to_datetime.to_s,
      'orderBy' => 'startTime',
      'singleEvents' => true
    }).data.items
  end

  def service
    @client.discovered_api('calendar', 'v3')
  end
end

class WhatsOn < Sinatra::Base
  configure do
    ApiClient.instance = ApiClient.new

    set :protection, :except => :frame_options
  end

  get '/events.json' do
    events = ApiClient.instance.events.map do |event|
      {
        "title" => event["summary"],
        "location" => event["location"],
        "start" => event["start"]["dateTime"],
        "end" => event["end"]["dateTime"],
      }
    end
    events.to_json
  end

  get '/' do
    redirect to('/dashboard')
  end

  get '/dashboard' do
    erb :dashboard
  end
end
